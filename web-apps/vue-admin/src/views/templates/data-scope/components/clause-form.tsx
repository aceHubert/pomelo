import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { Button, Input, InputNumber, Select, Checkbox, DatePicker, Tooltip } from 'ant-design-vue';
import { warn, promisify, equals } from '@pomelo/shared-web';
import { message } from '@/components';
import { useI18n } from '@/hooks';
import { ClauseOperator, ClauseLogical, GroupState, ClauseValueType } from '../constants';
import './styles/clause-form.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { ClauseField } from '../types';

export type GetAllowedValuesFn = (
  fieldName: string,
) => Array<{ value: string | number; label: string }> | Promise<Array<{ value: string | number; label: string }>>;

type ClauseFieldInnerUse = {
  /** 内部使用，重新计算 */
  _allowedValues?: Array<{ value: string | number; label: string; [key: string]: any }>;
  /** 内部使用，重新计算 */
  _supportedOperators?: Array<{ value: ClauseOperator; label: string; supportValueTypes: ClauseValueType[] }>;
};

export type ClauseValue = {
  clauses: Clause[];
  groups: ClauseGroup[];
  maxGroupLevel: number;
};

type Clause = {
  index: number;
  field?: string;
  logical: ClauseLogical;
  operator: ClauseOperator;
  value?: any;
  valueType: ClauseValueType;
  /** 内部使用，重新计算 */
  _field?: ClauseField & ClauseFieldInnerUse;
};

type ClauseGroup = {
  start: number;
  end: number;
  level?: number;
};

type GroupItem = {
  group?: ClauseGroup;
  level?: number;
  cls: string;
  state?: GroupState;
  colspan: number;
};

interface ValidateCallback {
  (
    error: null | undefined,
    value: {
      clauses: Clause[];
      groups: ClauseGroup[];
      maxGroupLevel: number;
    },
  ): void;
  (error: Error, value?: never): void;
}

function validateClauseValue(val: ClauseValue) {
  return Array.isArray(val.clauses) && Array.isArray(val.clauses) && Number.isInteger(val.maxGroupLevel);
}

export default defineComponent({
  name: 'ClauseForm',
  props: {
    fields: { type: Array as PropType<ClauseField[]>, required: true },
    getAllowedValues: { type: Function as PropType<GetAllowedValuesFn>, required: true },
    defaultValue: {
      type: Object as PropType<ClauseValue>,
      validate: validateClauseValue,
    },
    value: {
      type: Object as PropType<ClauseValue>,
      validate: validateClauseValue,
    },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const i18n = useI18n();

    const logicalOpitons = computed(() => {
      return [
        {
          value: ClauseLogical.Or,
          label: i18n.tv('page_templates.data_scopes.components.clause_form.logical_options.or', '或') as string,
        },
        {
          value: ClauseLogical.And,
          label: i18n.tv('page_templates.data_scopes.components.clause_form.logical_options.and', '与') as string,
        },
      ];
    });

    const operatorOptions = computed(() => {
      return [
        {
          value: ClauseOperator.Equal,
          label: '=',
          supportValueTypes: [
            ClauseValueType.String,
            ClauseValueType.Char,
            ClauseValueType.Boolean,
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.Unequal,
          label: '<>',
          supportValueTypes: [
            ClauseValueType.String,
            ClauseValueType.Char,
            ClauseValueType.Boolean,
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.GreaterThan,
          label: '>',
          supportValueTypes: [
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.LessThan,
          label: '<',
          supportValueTypes: [
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.GreaterThanAndEqual,
          label: '>=',
          supportValueTypes: [
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.LessThanAndEqual,
          label: '<=',
          supportValueTypes: [
            ClauseValueType.DateTime,
            ClauseValueType.Byte,
            ClauseValueType.SByte,
            ClauseValueType.Decimal,
            ClauseValueType.Double,
            ClauseValueType.Single,
            ClauseValueType.Int16,
            ClauseValueType.Int32,
            ClauseValueType.Int64,
            ClauseValueType.UInt16,
            ClauseValueType.UInt32,
            ClauseValueType.UInt64,
            ClauseValueType.BigInteger,
          ],
        },
        {
          value: ClauseOperator.Includes,
          label: i18n.tv(
            'page_templates.data_scopes.components.clause_form.operator_options.include',
            '包含',
          ) as string,
          supportValueTypes: [ClauseValueType.String, ClauseValueType.Char],
        },
      ];
    });

    const checkedClauses = ref<number[]>([]);
    const clauseForm = reactive<ClauseValue>({
      clauses: [],
      groups: [],
      maxGroupLevel: 0,
    });

    const getSupportedOperators = (field: ClauseField & ClauseFieldInnerUse) => {
      const ships: Array<{ value: ClauseOperator; label: string; supportValueTypes: ClauseValueType[] }> = [];
      const supportedOperators = operatorOptions.value;
      for (let i = 0; i < supportedOperators.length; i++) {
        const ship = supportedOperators[i];
        if (ship.supportValueTypes.includes(field.valueType)) {
          ships.push(ship);
        }
      }
      // 如果可先值为数级，操作只允许等于和不等于
      if (Array.isArray(field._allowedValues)) {
        return ships.filter(({ value: operator }) => [ClauseOperator.Equal, ClauseOperator.Unequal].includes(operator));
      } else {
        return ships;
      }
    };

    const resolveField = (fieldName: string): Promise<ClauseField & ClauseFieldInnerUse> => {
      return new Promise((resolve, reject) => {
        // the field metadata
        const field = props.fields.find((f) => f.fieldName === fieldName) as ClauseField & ClauseFieldInnerUse;

        if (!field) {
          reject(new Error('The field "' + fieldName + '" not supported.'));
          return;
        }

        if (field._allowedValues?.length) {
          warn(process.env.NODE_ENV === 'production', 'Resolved field "' + fieldName + '" from exists allowedValues.');
          field._supportedOperators = getSupportedOperators(field);
          resolve(field);
          return;
        }

        const allowedValues = props.getAllowedValues(fieldName);

        promisify(allowedValues)
          .then((values) => {
            warn(process.env.NODE_ENV === 'production', 'Resolved field "' + fieldName + '" from remote.');
            field._allowedValues = values;
            field._supportedOperators = getSupportedOperators(field);
            resolve(field);
          })
          .catch((err) => reject(err));
      });
    };

    const ensureAllowedValues = (clauses: Clause[]) => {
      const resolvers: Promise<Clause>[] = [];

      clauses.forEach((clause, index) => {
        clause.index = index;
        if (clause.field) {
          resolvers.push(resolveField(clause.field).then((field) => ({ ...clause, _field: field })));
        }
      });

      return Promise.all(resolvers);
    };

    props.defaultValue?.clauses &&
      ensureAllowedValues(props.defaultValue?.clauses).then((clauses) => {
        clauseForm.clauses = clauses;
        clauseForm.groups = props.defaultValue?.groups || [];
        clauseForm.maxGroupLevel = props.defaultValue?.maxGroupLevel || 0;
      });

    watch(
      () => props.value,
      (val) => {
        if (val) {
          if (val.maxGroupLevel !== clauseForm.maxGroupLevel) {
            clauseForm.maxGroupLevel = val.maxGroupLevel || 0;
          }
          if (!equals(val.groups, clauseForm.groups)) {
            clauseForm.groups = val.groups || [];
          }
          // clauseForm.clauses 有内部定义 _field 字段，比对会造成死循环
          if (
            !equals(
              val.clauses,
              clauseForm.clauses.map(({ _field, ...rest }) => rest),
            )
          ) {
            val?.clauses
              ? ensureAllowedValues(val.clauses).then((clauses) => {
                  clauseForm.clauses = clauses;
                })
              : (clauseForm.clauses = val.clauses || []);
          }
        }
      },
      { immediate: true },
    );

    watch(
      clauseForm,
      (form) => {
        // v-model 只把验证通过的值返回到父级
        validate((error, value) => {
          if (error) return;

          emit('input', value);
        });
        emit('change', form);
      },
      { deep: true },
    );

    const isCheckedClauseValid = computed(() => {
      const _checkedClauses = checkedClauses.value;
      const checkedCount = _checkedClauses.length;
      if (checkedCount < 2) {
        return false;
      }
      const sortedClauses = _checkedClauses.sort();
      for (let i = 0; i < checkedCount; i++) {
        const clauseIndex = sortedClauses[i];
        if (clauseIndex !== sortedClauses[i + 1] - 1) {
          return false;
        }
        if (i === checkedCount - 2) {
          break;
        }
      }
      return true;
    });

    const groupLevel = computed(() => {
      return (clauseForm.maxGroupLevel || 0) + 1;
    });

    const getDefaultClause = (): Clause => {
      return {
        index: 0,
        field: void 0,
        logical: ClauseLogical.And,
        operator: ClauseOperator.Equal,
        value: void 0,
        valueType: 0,
        _field: {
          label: '',
          fieldName: '',
          valueType: ClauseValueType.String,
          _allowedValues: void 0,
          _supportedOperators: void 0,
        },
      };
    };

    const getGroupInfo = (clause: Clause) => {
      const clauseIndex = clause.index;
      const colGroups = [] as GroupItem[];
      const groups = clauseForm.groups;
      let currentGroup: ClauseGroup | undefined;

      const matchedGroups: ClauseGroup[] = [];
      if (groups && groups.length) {
        groups.forEach((g) => {
          if (g.start <= clauseIndex && g.end >= clauseIndex) {
            g.level = g.level || 0;
            matchedGroups.push(g);
          }
        });
        matchedGroups.sort(function (a, b) {
          return b.level! - a.level!;
        });
      }

      let colspan = 0;
      if (matchedGroups.length) {
        for (let level = clauseForm.maxGroupLevel || 0; level >= 0; level--) {
          if (matchedGroups.length > 0 && (matchedGroups[0].level || 0) === level) {
            if (colspan > 0) {
              addColGroup();
              colspan = 0;
            }
            currentGroup = matchedGroups.shift();
          }
          colspan++;
        }

        if (colspan > 0) {
          addColGroup();
        }
      } else {
        colGroups.push({
          state: GroupState.Placeholder,
          cls: 'no-group',
          colspan: groupLevel.value,
        });
      }

      return colGroups;

      function addColGroup() {
        const colGroup: GroupItem = {
          level: 0,
          cls: '',
          colspan: colspan,
        };

        if (currentGroup) {
          colGroup.group = currentGroup;
          colGroup.level = (currentGroup.level || 0) % 5;
          colGroup.cls = 'group group--cat-' + colGroup.level;
          if (currentGroup.start === clauseIndex) {
            colGroup.state = GroupState.Start;
            colGroup.cls += ' group-start';
          } else {
            colGroup.state = GroupState.Placeholder;
          }
          if (currentGroup.end === clauseIndex) {
            colGroup.cls += ' group-end';
          }
        }

        colGroups.push(colGroup);
      }
    };

    const addClause = (clause?: Clause) => {
      const newClause = getDefaultClause();
      clauseForm.clauses = clauseForm.clauses || [];
      if (clause) {
        newClause.index = clause.index;
        clauseForm.clauses.splice(clause.index + 1, 0, newClause);
        const clauseCount = clauseForm.clauses.length;
        let index = newClause.index + 1;
        for (; index < clauseCount; index++) {
          clauseForm.clauses[index].index = index;
        }
        clauseForm.groups = updateFilterGroups(clauseForm.groups, newClause.index, !0);
      } else {
        // prepend
        // newClause.index = 0;
        // filter.clauses.forEach(c => c.index++);
        // filter.clauses.unshift(newClause);

        // append
        newClause.index = clauseForm.clauses.length;
        clauseForm.clauses.push(newClause);
      }
    };

    const updateFilterGroupLevels = (groups: ClauseGroup[]) => {
      let level = 0;
      if (groups && groups.length) {
        groups.forEach((g) => (g.level = 0));
        getLevel(groups);
      }
      return level;

      function getLevel(groups: ClauseGroup[], group?: ClauseGroup) {
        groups.forEach((g) => {
          if (group) {
            if (g !== group && group.start <= g.start && group.end >= g.end) {
              getLevel(groups, g);
              group.level = Math.max(group.level!, g.level! + 1);
              level = Math.max(level, group.level);
            }
          } else {
            getLevel(groups, g);
          }
        });
      }
    };

    const updateFilterGroups = (groups: ClauseGroup[], changedIndex: number, addMode = true) => {
      if (groups && groups.length) {
        if (addMode) {
          // in the add scene
          // move index of start/end witch in the after of changedIndex to next
          groups.forEach((g) => {
            if (g.end >= changedIndex) {
              if (g.start >= changedIndex) {
                g.start++;
              }
              g.end++;
            }
          });
        } else {
          const newGroups: ClauseGroup[] = [];
          const cache: Record<string, boolean> = {};
          groups.forEach((g) => {
            // Adjust index
            if (g.end >= changedIndex) {
              if (g.start > changedIndex) {
                g.start = Math.max(0, g.start - 1);
              }
              g.end = Math.max(0, g.end - 1);
            }
            if (g.start !== g.end) {
              const key = g.start + '_' + g.end;
              key in cache || ((cache[key] = !0), newGroups.push(g));
            }
          });
          return newGroups;
        }
      }
      return groups;
    };

    /**
     * 验证定义有效性
     */
    const validate = (callback: ValidateCallback) => {
      if (!clauseForm.clauses?.length) {
        return callback(
          new Error(
            i18n.tv(
              'page_templates.data_scopes.components.clause_form.error.clauses_definition_required',
              '范围至少需要一个子句！',
            ) as string,
          ),
        );
      }
      const clauses: Clause[] = [];
      for (const [index, clause] of clauseForm.clauses.entries()) {
        if (!clause.field) {
          return callback(
            new Error(
              i18n.tv(
                'page_templates.data_scopes.components.clause_form.error.field_required_in_row',
                `第${index + 1}行存在字段为空的子句！`,
                {
                  row: index + 1,
                },
              ) as string,
            ),
          );
        }
        if (clause.value === void 0) {
          return callback(
            new Error(
              i18n.tv(
                'page_templates.data_scopes.components.clause_form.error.value_required_in_row',
                `第${index + 1}存在字段值为空的子句！`,
                {
                  row: index + 1,
                },
              ) as string,
            ),
          );
        } else if (clause._field?.validate) {
          const validResult = clause._field?.validate(clause.value);
          if (validResult === false || validResult instanceof Error) {
            return callback(
              validResult instanceof Error
                ? validResult
                : new Error(
                    i18n.tv(
                      'page_templates.data_scopes.components.clause_form.error.value_invalid',
                      `第${index + 1}存在字段值验证失败！`,
                      {
                        row: index + 1,
                      },
                    ) as string,
                  ),
            );
          }
        }

        clauses.push({
          index: clause.index,
          logical: clause.logical,
          field: clause.field,
          operator: clause.operator,
          value: clause.value,
          valueType: clause.valueType,
        });
      }

      const groups: ClauseGroup[] = [];
      const maxClauseIndex = clauses.length - 1;
      let needUpdateLevel = false;
      if (clauseForm.groups?.length) {
        clauseForm.groups.forEach((g) => {
          if (g.start === 0 && g.end === maxClauseIndex) {
            needUpdateLevel = true;
            return;
          }
          groups.push(g);
        });
      }

      let maxGroupLevel = clauseForm.maxGroupLevel || 0;
      if (needUpdateLevel) {
        maxGroupLevel = updateFilterGroupLevels(groups);
      }

      return callback(null, {
        clauses: clauses,
        groups: groups,
        maxGroupLevel: maxGroupLevel,
      });
    };

    const handleGroupSelectedClauses = () => {
      if (!isCheckedClauseValid.value) {
        return false;
      }
      let start = Number.MAX_VALUE,
        end = 0;
      const groups = clauseForm.groups || [];
      const checkedItems = checkedClauses.value;
      checkedItems.forEach((i) => {
        start = Math.min(start, i);
        end = Math.max(end, i);
      });
      if (start >= end) {
        message.error(
          i18n.tv(
            'page_templates.data_scopes.components.clause_form.error.unable_to_group_those_clauses',
            '无法将这些子句分组！',
          ) as string,
        );
        return false;
      }
      if (start === 0 && end === clauseForm.clauses.length - 1) {
        message.error(
          i18n.tv(
            'page_templates.data_scopes.components.clause_form.error.no_need_to_group_those_clauses',
            '所选子句分组不必要！',
          ) as string,
        );
        return false;
      }
      let checkResult = true;
      groups.forEach((g) => {
        if (g.start === start && g.end === end) {
          message.error(
            i18n.tv(
              'page_templates.data_scopes.components.clause_form.error.selected_clauses_already_has_a_group',
              '所选子句已有一个组！',
            ) as string,
          );
          checkResult = false;
          return false;
        }
        if ((g.start < start && g.end > start && g.end < end) || (g.start < end && g.end > end && g.start > start)) {
          message.error(
            i18n.tv(
              'page_templates.data_scopes.components.clause_form.error.no_crossing_between_groups',
              '组与组之间不能交叉！',
            ) as string,
          );
          checkResult = false;
          return false;
        }
        if (g.end === start || g.start === end) {
          message.error(
            i18n.tv(
              'page_templates.data_scopes.components.clause_form.error.no_crossing_between_groups',
              '组与组之间不能交叉！',
            ) as string,
          );
          checkResult = false;
          return false;
        }
        return;
      });

      if (!checkResult) {
        return false;
      }

      groups.push({
        start: start,
        end: end,
      });

      clauseForm.groups = groups;
      clauseForm.maxGroupLevel = updateFilterGroupLevels(groups);

      checkedClauses.value = [];
      return;
    };

    const handleUnGroup = (groupInfo: GroupItem) => {
      const groups: ClauseGroup[] = [];
      clauseForm.groups.forEach((g) => {
        if (groupInfo.group?.start !== g.start || groupInfo.group?.end !== g.end) {
          groups.push(g);
        }
      });
      clauseForm.groups = groups;
      clauseForm.maxGroupLevel = updateFilterGroupLevels(groups);
    };

    const handleAppendClause = () => {
      addClause();
      return false;
    };

    const handleInsertClause = (clause: Clause) => {
      addClause(clause);
      return false;
    };

    const handleRemoveClause = (clause: Clause) => {
      const index = clause.index;
      clauseForm.clauses.splice(index, 1);
      const clauseCount = clauseForm.clauses.length;
      for (let i = index; i < clauseCount; i++) {
        clauseForm.clauses[i].index = i;
      }
      clauseForm.groups = updateFilterGroups(clauseForm.groups, index, !1);
      clauseForm.maxGroupLevel = updateFilterGroupLevels(clauseForm.groups);
      return false;
    };

    const handleFieldChange = (clause: Clause) => {
      warn(process.env.NODE_ENV === 'production', 'handle clause field "' + clause.field + '" change');
      clause._field = undefined;
      resolveField(clause.field!)
        .then((field) => {
          clause.value = void 0;
          clause.operator = field._supportedOperators?.[0].value || ClauseOperator.Equal;
          clause.valueType = field.valueType;
          clause._field = field;
        })
        .catch((err) => {
          clause.value = void 0;
          message.error(err.message);
        });
      return true;
    };

    return {
      logicalOpitons,
      operatorOptions,
      checkedClauses,
      clauseForm,
      isCheckedClauseValid,
      groupLevel,
      getGroupInfo,
      validate,
      handleUnGroup,
      handleAppendClause,
      handleFieldChange,
      handleGroupSelectedClauses,
      handleInsertClause,
      handleRemoveClause,
    };
  },
  render() {
    return (
      <div class="clause-form">
        <table class="clauses">
          <tbody>
            <tr class="clause clause--header">
              <th class="actions"></th>
              <th class="group-actions">
                <Tooltip
                  title={this.$tv(
                    'page_templates.data_scopes.components.clause_form.tips.group_to_selected_items',
                    '对所选子句进行分组',
                  )}
                >
                  <Button
                    type="link"
                    size="small"
                    icon="menu-unfold"
                    disabled={!this.isCheckedClauseValid}
                    onClick={() => this.handleGroupSelectedClauses()}
                  ></Button>
                </Tooltip>
              </th>
              <th class="groups" colspan={this.groupLevel}></th>
              <th class="logical">
                {this.$tv('page_templates.data_scopes.components.clause_form.table_header.logical', '与/或')}
              </th>
              <th class="field">
                {this.$tv('page_templates.data_scopes.components.clause_form.table_header.field', '字段')}
              </th>
              <th class="operator">
                {this.$tv('page_templates.data_scopes.components.clause_form.table_header.operator', '运算符')}
              </th>
              <th class="value">
                {this.$tv('page_templates.data_scopes.components.clause_form.table_header.value', '值')}
              </th>
            </tr>
            {this.clauseForm.clauses.map((clause, clauseIndex) => (
              <tr class="clause" key={clauseIndex}>
                <td class="actions">
                  <Tooltip
                    title={this.$tv(
                      'page_templates.data_scopes.components.clause_form.tips.insert_new_row',
                      '插入新的筛选器行',
                    )}
                  >
                    <Button
                      type="link"
                      size="small"
                      icon="plus"
                      class="gray--text red--text__hover"
                      onClick={() => this.handleInsertClause(clause)}
                    ></Button>
                  </Tooltip>
                  <Tooltip
                    title={this.$tv(
                      'page_templates.data_scopes.components.clause_form.tips.remove_current_row',
                      '删除此筛选器行',
                    )}
                  >
                    <Button
                      type="link"
                      size="small"
                      icon="close"
                      class="gray--text red--text__hover"
                      onClick={() => this.handleRemoveClause(clause)}
                    ></Button>
                  </Tooltip>
                </td>
                <td class="group-actions">
                  <Tooltip
                    title={this.$tv(
                      'page_templates.data_scopes.components.clause_form.tips.group_checkbox',
                      '切换筛选子句的分组',
                    )}
                  >
                    <input type="checkbox" name="ckb-group" vModel={this.checkedClauses} value={clauseIndex} />
                  </Tooltip>
                </td>
                {this.getGroupInfo(clause).map((group) => (
                  <td class={group.cls} colspan={group.colspan}>
                    {group.state === GroupState.Start ? (
                      <Tooltip
                        title={this.$tv(
                          'page_templates.data_scopes.components.clause_form.tips.ungroup_current_items',
                          '取消子句分组',
                        )}
                      >
                        <Button
                          type="link"
                          size="small"
                          icon="menu-fold"
                          onClick={() => this.handleUnGroup(group)}
                        ></Button>
                      </Tooltip>
                    ) : (
                      <div class="group-placeholder"></div>
                    )}
                  </td>
                ))}
                <td class="logical">
                  {clauseIndex !== 0 && (
                    <Select size="small" vModel={clause.logical}>
                      {this.logicalOpitons.map((item) => (
                        <Select.Option key={item.value}>{item.label}</Select.Option>
                      ))}
                    </Select>
                  )}
                </td>
                <td class="field">
                  <Select
                    vModel={clause.field}
                    size="small"
                    placeholder="请选择"
                    onChange={() => this.handleFieldChange(clause)}
                  >
                    {this.fields.map((item) => (
                      <Select.Option key={item.fieldName}>{item.label}</Select.Option>
                    ))}
                  </Select>
                </td>
                <td class="operator">
                  <Select vModel={clause.operator} size="small" placeholder="请选择">
                    {clause._field?._supportedOperators?.length ? (
                      clause._field._supportedOperators.map((item) => (
                        <Select.Option key={item.value} value={item.value}>
                          {item.label}
                        </Select.Option>
                      ))
                    ) : (
                      <Select.Option value={this.operatorOptions[0].value}>
                        {this.operatorOptions[0].label}
                      </Select.Option>
                    )}
                  </Select>
                </td>
                <td class="value">
                  {Array.isArray(clause._field?._allowedValues) ? (
                    <Select vModel={clause.value} size="small" style="max-width: 170px" placeholder="请选择">
                      {clause._field?._allowedValues.map((item) => (
                        <Select.Option key={item.value}>{item.label}</Select.Option>
                      ))}
                    </Select>
                  ) : clause.valueType === ClauseValueType.Boolean ? (
                    <Checkbox
                      defaultChecked={!!clause.value}
                      size="small"
                      onChange={(e: any) => (clause.value = e.target.checked)}
                    >
                      {clause.value ? this.$tv('common.btn_text.yes', '是') : this.$tv('common.btn_text.no', '否')}
                    </Checkbox>
                  ) : clause.valueType === ClauseValueType.DateTime ? (
                    <DatePicker
                      vModel={clause.value}
                      format={
                        clause._field?.dateFormat ||
                        (clause._field?.dateShowTime ? 'yyyy-MM-DD HH:mm:ss' : 'yyyy-MM-DD')
                      }
                      valueFormat={
                        clause._field?.dateFormat ||
                        (clause._field?.dateShowTime ? 'yyyy-MM-DD HH:mm:ss' : 'yyyy-MM-DD')
                      }
                      showTime={!!clause._field?.dateShowTime}
                      size="small"
                      placeholder="请选择"
                    ></DatePicker>
                  ) : clause.valueType === ClauseValueType.Byte ||
                    clause.valueType === ClauseValueType.SByte ||
                    clause.valueType === ClauseValueType.Decimal ||
                    clause.valueType === ClauseValueType.Double ||
                    clause.valueType === ClauseValueType.Single ||
                    clause.valueType === ClauseValueType.Int16 ||
                    clause.valueType === ClauseValueType.Int32 ||
                    clause.valueType === ClauseValueType.Int64 ||
                    clause.valueType === ClauseValueType.UInt16 ||
                    clause.valueType === ClauseValueType.UInt32 ||
                    clause.valueType === ClauseValueType.UInt64 ||
                    clause.valueType === ClauseValueType.BigInteger ? (
                    <InputNumber vModel={clause.value} size="small" style="max-width: 170px" />
                  ) : (
                    <Input
                      vModel={clause.value}
                      disabled={!clause.field}
                      size="small"
                      placeholder="请输入"
                      style="max-width: 170px"
                    />
                  )}
                </td>
              </tr>
            ))}
            <tr class="add-clause clause-row">
              <td class="add-remove" colspan="5">
                <Button type="link" icon="plus" size="small" class="px-0" onClick={() => this.handleAppendClause()}>
                  {this.$tv('page_templates.data_scopes.components.clause_form.btn_text.create_new_row', '添加新子句')}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
});
