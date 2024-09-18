import { merge } from 'lodash';
import { Logger } from '@nestjs/common';
import { Sequelize, Options, SyncOptions, ModelStatic, CreationAttributes } from 'sequelize';
import * as DataSources from './datasources';
import * as Entities from './entities';
import { default as ApiResources } from './entities/api-resources.entity';
import { default as ApiClaims } from './entities/api-claims.entity';
import { default as ApiScopeClaims } from './entities/api-scope-claims.entity';
import { default as ApiScopes } from './entities/api-scopes.entity';
import { default as ApiSecrets } from './entities/api-secrets.entity';
import { default as ApiProperties } from './entities/api-properties.entity';
import { default as IdentityResources } from './entities/identity-resources.entity';
import { default as IdentityClaims } from './entities/identity-claims.entity';
import { default as IdentityProperties } from './entities/identity-properties.entity';
import { default as Clients } from './entities/clients.entity';
import { default as ClientClaims } from './entities/client-claims.entity';
import { default as ClientCorsOrigins } from './entities/client-cors-origins.entity';
import { default as ClientScopes } from './entities/client-scopes.entity';
import { default as ClientGrantTypes } from './entities/client-grant-types.entity';
import { default as ClientPostLogoutRedirectUris } from './entities/client-post-logout-redirect-uris.entity';
import { default as ClientRedirectUris } from './entities/client-redirect-uris.entity';
import { default as ClientSecrets } from './entities/client-secrets.entity';
import { default as ClientProperites } from './entities/client-properties.entity';
import { TableInitFunc } from './interfaces/table-init-func.interface';
import { Models, TableAssociateFunc } from './interfaces/table-associate-func.interface';
import { DataInitArgs } from './interfaces/data-init-args.interface';

export interface DatabaseOptions extends Options {
  tablePrefix?: string;
}

export class DatabaseManager {
  private readonly logger = new Logger(DatabaseManager.name, { timestamp: true });
  private associated = false;
  private readonly options: DatabaseOptions;
  public readonly sequelize: Sequelize;

  constructor(options: DatabaseOptions);
  constructor(uri: string, options?: DatabaseOptions);
  constructor(uri: string | DatabaseOptions, options?: DatabaseOptions) {
    options = typeof uri === 'string' ? options : uri;
    this.options = merge(options || {}, {
      define: {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        charset: options?.define?.charset || 'utf8',
        collate: options?.define?.collate || '',
      },
    });
    this.sequelize = typeof uri === 'string' ? new Sequelize(uri, this.options) : new Sequelize(this.options);
  }

  /**
   * 创建数据库表结构及关联关系
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @returns 数据库模型
   */
  associate(): Models {
    const models: Partial<Models> = {};
    const associates: TableAssociateFunc[] = [];

    for (const key in Entities) {
      const {
        init,
        associate,
        default: model,
      } = (
        Entities as Record<
          string,
          {
            init?: TableInitFunc;
            associate?: TableAssociateFunc;
            default: ModelStatic<any>;
          }
        >
      )[key];
      init?.(this.sequelize, { prefix: this.options.tablePrefix || '' });
      associate && associates.push(associate);
      model && (models[model.name as keyof Models] = model);
    }

    // associate needs to be called after all models are initialized
    associates.forEach((associate) => associate(models as Models));

    this.associated = true;

    return models as Models;
  }

  /**
   * 初始化数据库
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param options 初始化参数
   * @returns true: 生成数据库成功；false: 跳过数据库生成(when 条件不满足) 否则抛出 Error
   */
  async sync(
    options?: SyncOptions & { when?: boolean | ((sequelize: Sequelize) => Promise<boolean>) },
  ): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
    } catch (err: any) {
      this.logger.error(`Unable to connect to the database, Error: ${err.message}`);
      throw err;
    }

    // 初始化关联关系
    !this.associated && this.associate();

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
   * 实始化数据（必须在DB初始化表结构后调用）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param initArgs 初始化参数
   */
  async initDatas(initArgs: DataInitArgs): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      if (initArgs.identityResources?.length) {
        // Initialize identity resources
        const identityResources = await IdentityResources.bulkCreate(
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

        identityClaimsCreation.length && (await IdentityClaims.bulkCreate(identityClaimsCreation, { transaction: t }));

        const identityPropertiesCreation = initArgs.identityResources.reduce((prev, item, index) => {
          return prev.concat(
            item.properties?.map((property) => ({
              identityResourceId: identityResources[index].id,
              ...property,
            })) ?? [],
          );
        }, [] as CreationAttributes<IdentityProperties>[]);

        identityPropertiesCreation.length &&
          (await IdentityProperties.bulkCreate(identityPropertiesCreation, { transaction: t }));
      }

      // Initialize api resources
      if (initArgs.apiResources?.length) {
        const apiResources = await ApiResources.bulkCreate(
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
        }, [] as CreationAttributes<ApiClaims>[]);

        apiClaimsCreation.length && (await ApiClaims.bulkCreate(apiClaimsCreation, { transaction: t }));

        const apiScopesCreation = initArgs.apiResources.reduce((prev, item, index) => {
          return prev.concat(
            item.scopes?.map(({ claims: _ignored0, ...scope }) => ({
              apiResourceId: apiResources[index].id,
              ...scope,
            })) ?? [],
          );
        }, [] as CreationAttributes<ApiScopes>[]);

        const apiScopes = apiScopesCreation.length
          ? await ApiScopes.bulkCreate(apiScopesCreation, { transaction: t })
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

        apiScopeClaimsCreation.length && (await ApiScopeClaims.bulkCreate(apiScopeClaimsCreation, { transaction: t }));

        const apiSecretsCreation = initArgs.apiResources.reduce((prev, item, index) => {
          return prev.concat(
            item.secrets?.map((secret) => ({
              apiResourceId: apiResources[index].id,
              ...secret,
            })) ?? [],
          );
        }, [] as CreationAttributes<ApiSecrets>[]);

        apiSecretsCreation.length && (await ApiSecrets.bulkCreate(apiSecretsCreation, { transaction: t }));

        const apiPropertiesCreation = initArgs.apiResources.reduce((prev, item, index) => {
          return prev.concat(
            item.properties?.map((property) => ({
              apiResourceId: apiResources[index].id,
              ...property,
            })) ?? [],
          );
        }, [] as CreationAttributes<ApiProperties>[]);

        apiPropertiesCreation.length && (await ApiProperties.bulkCreate(apiPropertiesCreation, { transaction: t }));
      }

      // Initialize clients
      if (initArgs.clients?.length) {
        const clients = await Clients.bulkCreate(
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

        clientClaimsCreation.length && (await ClientClaims.bulkCreate(clientClaimsCreation, { transaction: t }));

        const clientCorsOriginsCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.corsOrigins?.map((origin) => ({
              clientId: clients[index].id,
              origin,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientCorsOrigins>[]);

        clientCorsOriginsCreation.length &&
          (await ClientCorsOrigins.bulkCreate(clientCorsOriginsCreation, { transaction: t }));

        const clientScopesCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.scopes?.map((scope) => ({
              clientId: clients[index].id,
              scope,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientScopes>[]);

        clientScopesCreation.length && (await ClientScopes.bulkCreate(clientScopesCreation, { transaction: t }));

        const clientGrantTypesCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.grantTypes?.map((grantType) => ({
              clientId: clients[index].id,
              grantType,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientGrantTypes>[]);

        clientGrantTypesCreation.length &&
          (await ClientGrantTypes.bulkCreate(clientGrantTypesCreation, { transaction: t }));

        const clientRedirectUrisCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.redirectUris?.map((redirectUri) => ({
              clientId: clients[index].id,
              redirectUri,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientRedirectUris>[]);

        clientRedirectUrisCreation.length &&
          (await ClientRedirectUris.bulkCreate(clientRedirectUrisCreation, { transaction: t }));

        const clientPostLogoutRedirectUrisCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.postLogoutRedirectUris?.map((postLogoutRedirectUri) => ({
              clientId: clients[index].id,
              postLogoutRedirectUri,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientPostLogoutRedirectUris>[]);

        clientPostLogoutRedirectUrisCreation.length &&
          (await ClientPostLogoutRedirectUris.bulkCreate(clientPostLogoutRedirectUrisCreation, {
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

        clientSecretsCreation.length && (await ClientSecrets.bulkCreate(clientSecretsCreation, { transaction: t }));

        const clientPropertiesCreation = initArgs.clients.reduce((prev, item, index) => {
          return prev.concat(
            item.properties?.map((property) => ({
              clientId: clients[index].id,
              ...property,
            })) ?? [],
          );
        }, [] as CreationAttributes<ClientProperites>[]);

        clientPropertiesCreation.length &&
          (await ClientProperites.bulkCreate(clientPropertiesCreation, { transaction: t }));
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

export const dataSources = Object.values(DataSources);
export * from './datasources';
export * from './interfaces';
