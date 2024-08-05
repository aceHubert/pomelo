// The editor creator to use.
import BalloonEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import { BlockToolbar } from '@ckeditor/ckeditor5-ui';

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

export default class BalloonEditor extends BalloonEditorBase {}

// Plugins to include in the build.
// @ts-ignore
BalloonEditor.builtinPlugins = [
  BlockToolbar,
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
BalloonEditor.defaultConfig = {
  toolbar: {
    items: [
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
      'link',
    ],
    shouldNotGroupWhenFull: true,
  },
  blockToolbar: {
    items: [
      'undo',
      `redo`,
      '|',
      'heading',
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
      'blockQuote',
      'codeBlock',
      'gallery',
      'insertImage',
      'mediaEmbed',
      'insertTable',
    ],
    // @ts-expect-error type error
    icon: '<svg t="1696992621804" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5687" width="200" height="200"><path d="M707.047619 438.857143a219.428571 219.428571 0 1 1 0 438.857143 219.428571 219.428571 0 0 1 0-438.857143z m-238.933333 97.499428c-11.605333 22.698667-20.089905 47.299048-24.844191 73.142858L268.190476 609.52381v146.285714h188.952381a267.995429 267.995429 0 0 0 43.032381 73.142857H268.190476a73.142857 73.142857 0 0 1-73.142857-73.142857v-146.285714a73.142857 73.142857 0 0 1 73.142857-73.142858l199.92381-0.024381zM707.047619 512a146.285714 146.285714 0 1 0 0 292.571429 146.285714 146.285714 0 0 0 0-292.571429z m32.889905 64.633905L739.913143 633.904762h57.295238v73.142857h-57.295238v57.270857h-73.142857V707.047619H609.52381v-73.142857h57.246476v-57.270857h73.142857zM755.809524 146.285714a73.142857 73.142857 0 0 1 73.142857 73.142857v146.285715c0 17.432381-6.095238 33.426286-16.262095 46.006857A267.142095 267.142095 0 0 0 707.047619 390.095238c-57.417143 0-110.616381 18.041905-154.233905 48.761905H170.666667a73.142857 73.142857 0 0 1-73.142857-73.142857V219.428571a73.142857 73.142857 0 0 1 73.142857-73.142857h585.142857z m0 73.142857H170.666667v146.285715h585.142857V219.428571z" p-id="5688"></path></svg>',
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
      { language: 'yaml', label: 'YAML' },
      { language: 'xml', label: 'XML' },
    ],
  },
  // This value must be kept in sync with the language defined in webpack.config.js.
  language: 'en',
};
