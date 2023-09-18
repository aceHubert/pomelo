import { ref, reactive, set } from '@vue/composition-api';
import { message } from '@/components';
import { Taxonomy, useTemplateApi, useTermTaxonomyApi, useResApi } from '@/fetch/graphql';

// Types
import type { NewTemplateInput, NewTemplateMetaInput, UpdateTemplateInput } from '@/fetch/graphql/template';

export type AsyncTreeData = {
  id: string | number;
  title: any;
  value: string | number;
  pId?: string | number;
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
};

export type SelectData = {
  id: string | number;
  title: any;
  value: string | number;
  disabled?: boolean;
};

export const useDesignMixin = () => {
  const templateApi = useTemplateApi();
  const termTaxonomyApi = useTermTaxonomyApi();
  const resApi = useResApi();

  /**
   * 获取详情
   * 不会返回catch error
   */
  const getDetail = async (templateId: string | number) => {
    return templateApi
      .get({
        variables: {
          id: templateId,
        },
        catchError: true,
        loading: true,
      })
      .then(({ template }) => template);
  };

  /**
   * create/update 提交状态
   */
  const submitingRef = ref(false);

  /**
   * 新建
   * 返回catch error
   */
  const create = (input: NewTemplateInput) => {
    return templateApi
      .create({
        variables: {
          newTemplate: input,
        },
        loading: () => {
          submitingRef.value = true;
          return () => (submitingRef.value = false);
        },
      })
      .then(({ template }) => template);
  };

  /**
   * 修改
   * 返回catch error
   */
  const update = (
    templateId: number,
    input: UpdateTemplateInput,
    metas?: Array<{ metaKey: string; metaValue: string }>,
  ) => {
    submitingRef.value = true;
    return Promise.all([
      templateApi.update({
        variables: {
          id: templateId,
          updateTemplate: input,
        },
      }),
      metas?.map(({ metaKey, metaValue }) =>
        updateMetaByKey({
          templateId,
          metaKey,
          metaValue,
        }),
      ),
    ])
      .then((results) => results.every((result) => result))
      .finally(() => {
        submitingRef.value = false;
      });
  };

  /**
   * 新建 meta
   */
  const createMeta = (newMeta: NewTemplateMetaInput) => {
    return templateApi.createMeta({
      variables: {
        newMeta,
      },
    });
  };

  /**
   * 修改 meta
   */
  const updateMeta = ({ id, metaValue }: { id: number; metaValue: string }) => {
    return templateApi.updateMeta({
      variables: {
        id,
        metaValue,
      },
    });
  };

  /**
   * 根据 metaKey 修改 meta
   */
  const updateMetaByKey = ({
    templateId,
    metaKey,
    metaValue,
  }: {
    templateId: number;
    metaKey: string;
    metaValue: string;
  }) => {
    return templateApi.updateMetaByKey({
      variables: {
        templateId,
        metaKey,
        metaValue,
      },
    });
  };

  // #region category
  const category = reactive({
    /**
     * tree-select default value
     */
    treeData: [] as AsyncTreeData[],
    /**
     * tree-select selected values and lableInValue
     */
    selectKeys: [] as { label: string; value: string | number }[],
  });

  /**
   * 如果query是字符串则使用搜索，返回非嵌套模式
   * 不传参数返回顶级数据, 传{}返回全部数据
   * parentId为0是顶级数据
   */
  const getCategories = async (
    query:
      | string
      | {
          parentId: string | number;
          isLeaf?: boolean;
        } = { parentId: 0, isLeaf: false },
  ): Promise<AsyncTreeData[]> => {
    const inSearchMode = typeof query === 'string';
    const keyword = inSearchMode ? query : void 0;
    return termTaxonomyApi
      .getCategories({
        variables: {
          keyword,
          parentId: inSearchMode ? void 0 : query.parentId,
        },
      })
      .then(({ categories }) =>
        categories.map((item) => ({
          id: item.id,
          pId: inSearchMode ? void 0 : item.parentId,
          title: item.name,
          value: item.id,
          isLeaf: inSearchMode ? void 0 : query.isLeaf,
        })),
      )
      .catch((err) => {
        message.error(err.message);
        return [];
      });
  };

  /**
   * tree-select loadData
   */
  const loadCategoryData = (treeNode: { dataRef: AsyncTreeData }) => {
    return getCategories({ parentId: treeNode.dataRef.id }).then((treeData) => {
      if (treeData.length) {
        category.treeData = category.treeData.concat(...treeData);
      } else {
        treeNode.dataRef.isLeaf = true;
      }
    });
  };

  /**
   * tree-select search event
   */
  let inSearching = false,
    treeDataCache: AsyncTreeData[];
  const handleCategorySearch = (keyword: string) => {
    // 组织nested数据
    if (!inSearching && keyword.length) {
      treeDataCache = category.treeData;
    }
    if (keyword.length) {
      inSearching = true;
      // 当有搜索字段不显示层级，否则查询顶级数据
      getCategories(keyword).then((treeData) => {
        category.treeData = treeData;
      });
    } else {
      inSearching = false;
      category.treeData = treeDataCache;
    }
  };

  /**
   * tree-select change event
   */
  const handleCategoryChange =
    (templateId: string | number) =>
    (
      values: string[],
      labels: any[],
      extra: { checked: boolean; triggerNode?: { dataRef: AsyncTreeData }; triggerValue: string },
    ) => {
      extra.triggerNode?.dataRef && set(extra.triggerNode.dataRef, 'selectable', false);
      let promisify;
      if (extra.checked) {
        promisify = termTaxonomyApi
          .createRelationship({
            variables: {
              model: {
                objectId: templateId,
                termTaxonomyId: extra.triggerValue,
              },
            },
          })
          .then(() => {
            category.selectKeys.push({ value: extra.triggerValue, label: extra.triggerNode!.dataRef.title });
          });
      } else {
        promisify = termTaxonomyApi
          .deleteRelationship({
            variables: {
              objectId: templateId,
              termTaxonomyId: extra.triggerValue,
            },
          })
          .then(({ result }) => {
            result && (category.selectKeys = category.selectKeys.filter(({ value }) => value !== extra.triggerValue));
          });
      }
      promisify
        .catch((err) => {
          message.error(err.message);
        })
        .finally(() => {
          extra.triggerNode?.dataRef && set(extra.triggerNode?.dataRef, 'selectable', true);
        });
    };
  // #endregion

  // #region tag
  const tag = reactive({
    /**
     * select options
     */
    selectData: [] as SelectData[],
    /**
     * select selected values
     */
    selectKeys: [] as Array<string | number>,
  });

  /**
   * 如果query是字符串则使用搜索
   */
  const getTags = async (query?: string): Promise<AsyncTreeData[]> => {
    return termTaxonomyApi
      .getTags({
        variables: {
          keyword: query,
        },
      })
      .then(({ tags }) =>
        tags.map((item) => ({
          id: item.id,
          title: item.name,
          value: item.id,
        })),
      )
      .catch((err) => {
        message.error(err.message);
        return [];
      });
  };

  /**
   * select select event
   */
  const handleTagSelect = (templateId: string | number) => (value: string) => {
    const currentItem = tag.selectData.find(({ id }) => id === value);
    if (currentItem) {
      set(currentItem, 'disabled', true);
      termTaxonomyApi
        .createRelationship({
          variables: {
            model: {
              objectId: templateId,
              termTaxonomyId: value,
            },
          },
        })
        .then(() => {
          tag.selectKeys.push(value);
        })
        .catch((err) => {
          message.error(err.message);
        })
        .finally(() => {
          currentItem && set(currentItem, 'disabled', false);
        });
    } else {
      termTaxonomyApi
        .create({
          variables: {
            model: {
              name: value,
              taxonomy: Taxonomy.Tag,
              objectId: templateId,
              description: 'automatic add',
            },
          },
        })
        .then(({ term }) => {
          tag.selectKeys.push(term.id);
          tag.selectData.push({
            id: term.id,
            title: term.name,
            value: term.id,
          });
        })
        .catch((err) => {
          message.error(err.message);
        });
    }
  };

  /**
   * select deselect event
   */
  const handleTagDeselect = (templateId: string | number) => (value: string) => {
    const currentItem = tag.selectData.find(({ id }) => id === value);
    currentItem && set(currentItem, 'disabled', true);
    termTaxonomyApi
      .deleteRelationship({
        variables: {
          objectId: templateId,
          termTaxonomyId: value,
        },
      })
      .then(({ result }) => {
        result && (tag.selectKeys = tag.selectKeys.filter((key) => key !== value));
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        currentItem && set(currentItem, 'disabled', false);
      });
  };
  // #endregion

  const getCustomUploadRequest =
    (_objectKeyPrefix = 'templates/docs_') =>
    async (options: {
      file: File;
      method: 'PUT' | 'POST' | 'put' | 'post';
      withCredentials: boolean;
      onSuccess: (resp: { url: string }) => void;
      onError: (err: unknown) => void;
      onProgress: (event: any) => void;
    }) => {
      const { file, withCredentials, onSuccess, onError, onProgress } = options;
      resApi
        .uploadFile({
          variables: {
            file,
          },
          context: {
            fetchOptions: {
              withCredentials,
              onProgress,
            },
          },
        })
        .then(({ file }) => onSuccess({ url: file.fullPath }))
        .catch(onError);
      // upload to obs
      // const suffix = file.name.substring(file.name.lastIndexOf('.'));
      // const fileName = Math.random().toString(16).substring(2) + suffix;
      // const objectKey = `${objectKeyPrefix}${fileName}`;
      // resApi
      //   .getObsUploadSignedUrl({
      //     variables: {
      //       bucket: 'static-cdn',
      //       key: objectKey,
      //       headers: {
      //         'Content-Type': file.type,
      //       },
      //     },
      //   })
      //   .then(({ signedUrl: { url, headers } }) => {
      //     obsUpload({
      //       file,
      //       action: url,
      //       method,
      //       headers,
      //       withCredentials,
      //       onSuccess: () => onSuccess({ url: obsDisplayUrl(objectKey) }),
      //       onError,
      //       onProgress,
      //     });
      //   })
      //   .catch(onError);
    };

  return {
    submitingRef,
    category,
    tag,
    getDetail,
    create,
    update,
    createMeta,
    updateMeta,
    updateMetaByKey,
    getCategories,
    loadCategoryData,
    handleCategoryChange,
    handleCategorySearch,
    getTags,
    handleTagSelect,
    handleTagDeselect,
    getCustomUploadRequest,
  };
};
