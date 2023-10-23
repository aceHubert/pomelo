// The editor creator to use.
import BalloonEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';

import BlockToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize';
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily';
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageInsert from '@ckeditor/ckeditor5-image/src/imageinsert';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import PictureEditing from '@ckeditor/ckeditor5-image/src/pictureediting';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import ListProperties from '@ckeditor/ckeditor5-list/src/listproperties';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import CKBox from '@ckeditor/ckeditor5-ckbox/src/ckbox';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import CloudServices from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
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
// @ts-ignore
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
      'codeBlock',
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
  // This value must be kept in sync with the language defined in webpack.config.js.
  language: 'en',
};
