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
        const selectionAttributes = Object.fromEntries(selection.getAttributes());
        open({ accept: imageTypes?.map((type) => `image/${type}`).join(',') }, (url) => {
          const selectedElement = selection.getSelectedElement();
          let imageElement;
          if (selectedElement && imageUtils.isImage(selectedElement)) {
            const position = this.editor.model.createPositionAfter(selectedElement);
            imageElement = imageUtils.insertImage({ ...selectionAttributes, src: url }, position);
          } else {
            imageElement = imageUtils.insertImage({ ...selectionAttributes, src: url });
          }
          imageUtils.setImageNaturalSizeAttributes(imageElement);
        });
      });

      return button;
    };

    editor.ui.componentFactory.add('gallery', componentCreator);
  }
}
