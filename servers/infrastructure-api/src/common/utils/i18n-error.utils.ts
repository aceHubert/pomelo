import iterate from 'iterare';
import { snakeCase } from 'lodash';
import { getMetadataStorage } from 'class-validator';
import { ValidationError } from '@nestjs/common';
import { I18nService, TranslateOptions, Path, I18nValidationError } from 'nestjs-i18n';

export function formatI18nErrors<K = Record<string, unknown>>(
  errors: ValidationError[],
  i18n: I18nService<K>,
  options?: TranslateOptions,
): I18nValidationError[] {
  return errors.map((error) => {
    const limits = getMetadataStorage()
      .getTargetValidationMetadatas(error.target!.constructor, error.target!.constructor.name, true, false)
      .find((meta) => meta.target === error.target!.constructor && meta.propertyName === error.property);
    const constraints = Object.assign({}, limits?.constraints);
    error.children = formatI18nErrors(error.children ?? [], i18n, options);
    error.constraints = Object.keys(error.constraints ?? {}).reduce((result, key) => {
      const [translationKey, argsString] = error.constraints![key].split('|');
      const args = !!argsString ? JSON.parse(argsString) : {};
      result[key] = i18n.translate(
        `validation.${snakeCase(key).toUpperCase()}${argsString ? `|${argsString}` : ''}` as Path<K>,
        {
          ...options,
          defaultValue: translationKey,
          args: {
            property: error.property,
            value: error.value,
            target: error.target,
            contexts: error.contexts,
            constraints: constraints,
            ...args,
          },
        },
      );
      return result;
    }, {} as { [type: string]: string });
    return error;
  });
}

const prependConstraintsWithParentProp = (parentPath: string, error: ValidationError): ValidationError => {
  const constraints: { [type: string]: string } = {};
  for (const key in error.constraints) {
    constraints[key] = `${parentPath}.${error.constraints[key]}`;
  }
  return {
    ...error,
    constraints,
  };
};

const mapChildrenToValidationErrors = (error: ValidationError, parentPath?: string): ValidationError[] => {
  if (!(error.children && error.children.length)) {
    return [error];
  }
  const validationErrors = [];
  parentPath = parentPath ? `${parentPath}.${error.property}` : error.property;
  for (const item of error.children) {
    if (item.children && item.children.length) {
      validationErrors.push(...mapChildrenToValidationErrors(item, parentPath));
    }
    validationErrors.push(prependConstraintsWithParentProp(parentPath, item));
  }
  return validationErrors;
};

export function flattenValidationErrors(validationErrors: ValidationError[]): string[] {
  return iterate(validationErrors)
    .map((error) => mapChildrenToValidationErrors(error))
    .flatten()
    .filter((item) => !!item.constraints)
    .map((item) => Object.values(item.constraints!))
    .flatten()
    .toArray();
}
