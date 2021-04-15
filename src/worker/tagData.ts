import {TagData} from '../common/types';
// @ts-ignore
// import * as pako from 'pako';

declare function __webpack_require__(path: string): any;

const data = __webpack_require__(require.resolve('tag-data')) as TagData;
export default data;
// @ts-ignore
// window.pako = pako;
