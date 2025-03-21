import { Plugin, icons } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';
import { add } from '@ckeditor/ckeditor5-utils/src/translation-service';

export class Gallery extends Plugin {
  init() {
    const editor = this.editor;
    const t = editor.t;

    const open = (editor.config.get('gallery') as Record<string, any>)?.open;
    if (!open) return;

    add('zh-cn', {
      Gallery: '图库',
    });

    editor.model.schema.extend('imageInline', { allowAttributes: 'dataSrc' });
    editor.model.schema.extend('imageBlock', { allowAttributes: 'dataSrc' });

    editor.conversion.for('upcast').attributeToAttribute({
      view: 'data-src',
      model: 'dataSrc',
    });

    editor.conversion.for('downcast').add((dispatcher) => {
      dispatcher.on('attribute:dataSrc:imageInline', (evt, data, conversionApi) => {
        _setAttribute(evt, data, conversionApi, 'imageInline');
      });
      dispatcher.on('attribute:dataSrc:imageBlock', (evt, data, conversionApi) => {
        _setAttribute(evt, data, conversionApi, 'imageBlock');
      });
    });

    const _setAttribute = (evt, data, conversionApi, type) => {
      if (!conversionApi.consumable.consume(data.item, evt.name)) {
        return;
      }

      const viewWriter = conversionApi.writer;
      const figure = conversionApi.mapper.toViewElement(data.item);
      const img = type === 'imageBlock' ? figure.getChild(0) : figure;

      if (data.attributeNewValue !== null) {
        viewWriter.setAttribute('data-src', data.attributeNewValue, img);
        viewWriter.setAttribute('data-lazy', true, img);
      } else {
        viewWriter.removeAttribute('data-src', img);
        viewWriter.removeAttribute('data-lazy', img);
      }
    };

    const componentCreator = () => {
      const button = new ButtonView();

      button.set({
        label: t('Gallery'),
        icon: icons.image,
        tooltip: true,
      });

      const imageTypes = editor.config.get('image.upload.types');
      button.on('execute', () => {
        const selection = this.editor.model.document.selection;
        const imageUtils = this.editor.plugins.get('ImageUtils');
        open(
          { accept: imageTypes?.map((type) => `image/${type}`).join(',') },
          (attrs: { src: string; [key: string]: any }, imageType?: 'imageBlock' | 'imageInline' | null) => {
            if (!attrs.src) {
              throw new Error('src is required');
            }
            const selectedElement = selection.getSelectedElement();
            if (selectedElement && imageUtils.isImage(selectedElement)) {
              const position = this.editor.model.createPositionAfter(selectedElement);
              imageUtils.insertImage(attrs, position, imageType);
            } else {
              imageUtils.insertImage(attrs, null, imageType);
            }
          },
        );
      });

      return button;
    };

    editor.ui.componentFactory.add('gallery', componentCreator);
  }
}
