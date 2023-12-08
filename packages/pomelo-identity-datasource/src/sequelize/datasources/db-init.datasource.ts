import { Injectable } from '@nestjs/common';
import { Sequelize, SyncOptions, CreationAttributes } from 'sequelize';
import { default as ApiCleams } from '../entities/api-claims.entity';
import { default as ApiScopeClaims } from '../entities/api-scope-claims.entity';
import { default as ApiScopes } from '../entities/api-scopes.entity';
import { default as ApiSecrets } from '../entities/api-secrets.entity';
import { default as ApiProperties } from '../entities/api-properties.entity';
import { default as IdentityClaims } from '../entities/identity-claims.entity';
import { default as IdentityProperties } from '../entities/identity-properties.entity';
import { default as ClientClaims } from '../entities/client-claims.entity';
import { default as ClientCorsOrigins } from '../entities/client-cors-origins.entity';
import { default as ClientScopes } from '../entities/client-scopes.entity';
import { default as ClientGrantTypes } from '../entities/client-grant-types.entity';
import { default as ClientPostLogoutRedirectUris } from '../entities/client-post-logout-redirect-uris.entity';
import { default as ClientRedirectUris } from '../entities/client-redirect-uris.entity';
import { default as ClientSecrets } from '../entities/client-secrets.entity';
import { default as ClientProperites } from '../entities/client-properties.entity';
import { InitArgs } from '../interfaces/init-args.interface';
import { IdentityService } from '../../identity.service';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class DbInitDataSource extends BaseDataSource {
  constructor(protected readonly identityService: IdentityService) {
    super();
  }

  /**
   * 初始化数据库表结构
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param options 初始化参数
   * @returns true: 生成数据库成功；false: 跳过数据库生成(when 条件不满足) 否则抛出 Error
   */
  async initDB(
    options?: SyncOptions & { when?: boolean | ((sequelize: Sequelize) => Promise<boolean>) },
  ): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
    } catch (err: any) {
      this.logger.error(`Unable to connect to the database, Error: ${err.message}`);
      throw err;
    }

    try {
      // eslint-disable-next-line prefer-const
      let { when = true, ...syncOptions } = options || {};
      if (typeof when === 'function') {
        when = await when.call(null, this.sequelize);
      }
      if (when) {
        await this.sequelize.sync(syncOptions);
        return true;
      }
      return false;
    } catch (err: any) {
      this.logger.error(`Unable to sync to the database, Error: ${err.message}`);
      throw err;
    }
  }

  /**
   * 检查是否在在表，用于初始化表结构
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   */
  // haveTables(): Promise<boolean> {
  //   if (this.databaseDialect === 'mysql') {
  //     return this.sequelize
  //       .query(
  //         'select count(1) as tableCount from `INFORMATION_SCHEMA`.`TABLES` where `TABLE_SCHEMA`= (select database())',
  //       )
  //       .then(([value]) => {
  //         // 当没有表的时候初始化
  //         return (value as any)[0].tableCount > 0;
  //       });
  //   } else {
  //     // todo: 其它数据库
  //     this.logger.warn(`${this.databaseDialect} is not supported!`);
  //     return Promise.resolve(true);
  //   }
  // }

  /**
   * 实始化数据（必须在DB初始化表结构后调用）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param initArgs 初始化参数
   */
  async initDatas(initArgs: InitArgs): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      // Initialize identity resources
      const identityResources = await this.models.IdentityResources.bulkCreate(
        initArgs.identityResources.map(
          ({ claims: _ignored0, properties: _ignored1, ...identityResource }) => identityResource,
        ),
        { transaction: t },
      );

      const identityClaimsCreation = initArgs.identityResources.reduce((prev, item, index) => {
        return prev.concat(
          item.claims?.map((claim) => ({
            identityResourceId: identityResources[index].id,
            type: claim,
          })) ?? [],
        );
      }, [] as CreationAttributes<IdentityClaims>[]);

      identityClaimsCreation.length &&
        (await this.models.IdentityClaims.bulkCreate(identityClaimsCreation, { transaction: t }));

      const identityPropertiesCreation = initArgs.identityResources.reduce((prev, item, index) => {
        return prev.concat(
          item.properties?.map((property) => ({
            identityResourceId: identityResources[index].id,
            ...property,
          })) ?? [],
        );
      }, [] as CreationAttributes<IdentityProperties>[]);

      identityPropertiesCreation.length &&
        (await this.models.IdentityProperties.bulkCreate(identityPropertiesCreation, { transaction: t }));

      // Initialize api resources
      const apiResources = await this.models.ApiResources.bulkCreate(
        initArgs.apiResources.map(
          ({ claims: _ignored0, scopes: _ignored1, secrets: _ignored2, properties: _ignored3, ...apiResource }) =>
            apiResource,
        ),
        { transaction: t },
      );

      const apiClaimsCreation = initArgs.apiResources.reduce((prev, item, index) => {
        return prev.concat(
          item.claims?.map((claim) => ({
            apiResourceId: apiResources[index].id,
            type: claim,
          })) ?? [],
        );
      }, [] as CreationAttributes<ApiCleams>[]);

      apiClaimsCreation.length && (await this.models.ApiClaims.bulkCreate(apiClaimsCreation, { transaction: t }));

      const apiScopesCreation = initArgs.apiResources.reduce((prev, item, index) => {
        return prev.concat(
          item.scopes?.map(({ claims: _ignored0, ...scope }) => ({
            apiResourceId: apiResources[index].id,
            ...scope,
          })) ?? [],
        );
      }, [] as CreationAttributes<ApiScopes>[]);

      const apiScopes = apiScopesCreation.length
        ? await this.models.ApiScopes.bulkCreate(apiScopesCreation, { transaction: t })
        : [];

      let scopeClaimsIndex = 0;
      const apiScopeClaimsCreation = initArgs.apiResources.reduce((prev, item) => {
        item.scopes?.forEach((scope) => {
          prev = prev.concat(
            scope.claims?.map((claim) => ({
              apiScopeId: apiScopes[scopeClaimsIndex].id,
              type: claim,
            })) ?? [],
          );
          scopeClaimsIndex++;
        });
        return prev;
      }, [] as CreationAttributes<ApiScopeClaims>[]);

      apiScopeClaimsCreation.length &&
        (await this.models.ApiScopeClaims.bulkCreate(apiScopeClaimsCreation, { transaction: t }));

      const apiSecretsCreation = initArgs.apiResources.reduce((prev, item, index) => {
        return prev.concat(
          item.secrets?.map((secret) => ({
            apiResourceId: apiResources[index].id,
            ...secret,
          })) ?? [],
        );
      }, [] as CreationAttributes<ApiSecrets>[]);

      apiSecretsCreation.length && (await this.models.ApiSecrets.bulkCreate(apiSecretsCreation, { transaction: t }));

      const apiPropertiesCreation = initArgs.apiResources.reduce((prev, item, index) => {
        return prev.concat(
          item.properties?.map((property) => ({
            apiResourceId: apiResources[index].id,
            ...property,
          })) ?? [],
        );
      }, [] as CreationAttributes<ApiProperties>[]);

      apiPropertiesCreation.length &&
        (await this.models.ApiProperties.bulkCreate(apiPropertiesCreation, { transaction: t }));

      // Initialize clients
      const clients = await this.models.Clients.bulkCreate(
        initArgs.clients.map(
          ({
            claims: _ignored0,
            corsOrigins: _ignored1,
            scopes: _ignored2,
            grantTypes: _ignored3,
            redirectUris: _ignored4,
            postLogoutRedirectUris: _ignored5,
            secrets: _ignored6,
            properties: _ignored7,
            ...client
          }) => client,
        ),
        { transaction: t },
      );

      const clientClaimsCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.claims?.map((claim) => ({
            clientId: clients[index].id,
            type: claim.type,
            value: claim.value,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientClaims>[]);

      clientClaimsCreation.length &&
        (await this.models.ClientClaims.bulkCreate(clientClaimsCreation, { transaction: t }));

      const clientCorsOriginsCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.corsOrigins?.map((origin) => ({
            clientId: clients[index].id,
            origin,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientCorsOrigins>[]);

      clientCorsOriginsCreation.length &&
        (await this.models.ClientCorsOrigins.bulkCreate(clientCorsOriginsCreation, { transaction: t }));

      const clientScopesCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.scopes?.map((scope) => ({
            clientId: clients[index].id,
            scope,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientScopes>[]);

      clientScopesCreation.length &&
        (await this.models.ClientScopes.bulkCreate(clientScopesCreation, { transaction: t }));

      const clientGrantTypesCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.grantTypes?.map((grantType) => ({
            clientId: clients[index].id,
            grantType,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientGrantTypes>[]);

      clientGrantTypesCreation.length &&
        (await this.models.ClientGrantTypes.bulkCreate(clientGrantTypesCreation, { transaction: t }));

      const clientRedirectUrisCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.redirectUris?.map((redirectUri) => ({
            clientId: clients[index].id,
            redirectUri,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientRedirectUris>[]);

      clientRedirectUrisCreation.length &&
        (await this.models.ClientRedirectUris.bulkCreate(clientRedirectUrisCreation, { transaction: t }));

      const clientPostLogoutRedirectUrisCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.postLogoutRedirectUris?.map((postLogoutRedirectUri) => ({
            clientId: clients[index].id,
            postLogoutRedirectUri,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientPostLogoutRedirectUris>[]);

      clientPostLogoutRedirectUrisCreation.length &&
        (await this.models.ClientPostLogoutRedirectUris.bulkCreate(clientPostLogoutRedirectUrisCreation, {
          transaction: t,
        }));

      const clientSecretsCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.secrets?.map((secret) => ({
            clientId: clients[index].id,
            ...secret,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientSecrets>[]);

      clientSecretsCreation.length &&
        (await this.models.ClientSecrets.bulkCreate(clientSecretsCreation, { transaction: t }));

      const clientPropertiesCreation = initArgs.clients.reduce((prev, item, index) => {
        return prev.concat(
          item.properties?.map((property) => ({
            clientId: clients[index].id,
            ...property,
          })) ?? [],
        );
      }, [] as CreationAttributes<ClientProperites>[]);

      clientPropertiesCreation.length &&
        (await this.models.ClientProperties.bulkCreate(clientPropertiesCreation, { transaction: t }));

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
