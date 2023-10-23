// The editor creator to use.
import DecoupledEditorBase from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { Bold, Italic, Strikethrough, Underline } from '@ckeditor/ckeditor5-basic-styles';
import { FontSize, FontFamily, FontColor, FontBackgroundColor } from '@ckeditor/ckeditor5-font';
import {
  Image,
  ImageInsert,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  PictureEditing,
} from '@ckeditor/ckeditor5-image';
import { Indent, IndentBlock } from '@ckeditor/ckeditor5-indent';
import { Link } from '@ckeditor/ckeditor5-link';
import { List, ListProperties } from '@ckeditor/ckeditor5-list';
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { Table, TableToolbar } from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { CodeBlock } from '@ckeditor/ckeditor5-code-block';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CKBox } from '@ckeditor/ckeditor5-ckbox';
import { CKFinder } from '@ckeditor/ckeditor5-ckfinder';
import { UploadAdapter } from '@ckeditor/ckeditor5-adapter-ckfinder';
import { CloudServices } from '@ckeditor/ckeditor5-cloud-services';
import { EasyImage } from '@ckeditor/ckeditor5-easy-image';
import { Gallery } from './plugins/gallery';
import { CustomUploadAdapter } from './plugins/custom-upload-adapter';

export default class DecoupledEditor extends DecoupledEditorBase {}

// Plugins to include in the build.
// @ts-ignore
DecoupledEditor.builtinPlugins = [
  Essentials,
  Alignment,
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  Autoformat,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  BlockQuote,
  Heading,
  Image,
  ImageInsert,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Link,
  List,
  ListProperties,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  PictureEditing,
  Table,
  TableToolbar,
  TextTransformation,
  CodeBlock,
  CKBox,
  CKFinder,
  CloudServices,
  UploadAdapter,
  EasyImage,
  Gallery,
  CustomUploadAdapter,
];

// Editor configuration.
DecoupledEditor.defaultConfig = {
  toolbar: {
    items: [
      'undo',
      `redo`,
      '|',
      'heading',
      '|',
      'bold',
      'italic',
      'strikethrough',
      'underline',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'alignment:left',
      'alignment:right',
      'alignment:center',
      'alignment:justify',
      '|',
      'outdent',
      'indent',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'link',
      'blockQuote',
      'codeBlock',
      'gallery',
      'insertImage',
      'mediaEmbed',
      'insertTable',
    ],
  },
  indentBlock: {
    offset: 1,
    unit: 'em',
  },
  fontSize: {
    options: [9, 10, 12, 14, 18, 22, 28],
  },
  image: {
    resizeUnit: 'px',
    toolbar: [
      'imageStyle:inline',
      'imageStyle:wrapText',
      'imageStyle:breakText',
      '|',
      'toggleImageCaption',
      'imageTextAlternative',
    ],
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
  codeBlock: {
    languages: [
      { language: 'plaintext', label: 'Plain text' }, // The default language.
      { language: 'css', label: 'CSS' },
      { language: 'html', label: 'HTML' },
      { language: 'javascript', label: 'JavaScript' },
      { language: 'typescript', label: 'TypeScript' },
      { language: 'cpp', label: 'C++' },
      { language: 'cs', label: 'C#' },
      { language: 'java', label: 'Java' },
      { language: 'php', label: 'PHP' },
      { language: 'python', label: 'Python' },
      { language: 'ruby', label: 'Ruby' },
      { language: 'json', label: 'JSON' },
      { language: 'xml', label: 'XML' },
    ],
  },
  // This value must be kept in sync with the language defined in webpack.config.js.
  language: 'en',
};
