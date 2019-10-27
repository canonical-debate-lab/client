import { CachedTransform, IsNaN } from 'js-vextensions';
import { GetData, StoreAccessor } from 'Utils/FrameworkOverrides';
import { Image } from './images/@Image';

export function GetImage(id: string) {
	if (id == null || IsNaN(id)) return null;
	return GetData('images', id) as Image;
}
/* export async function GetImageAsync(id: string) {
	return await GetDataAsync(`images/${id}`) as Image;
} */

export const GetImages = StoreAccessor((): Image[] => {
	const entryMap = GetData({ collection: true }, 'images');
	return CachedTransform('GetImages', [], entryMap, () => (entryMap ? entryMap.VValues(true) : []));
	// return CachedTransform("GetImages", {}, imagesMap, ()=>imagesMap ? imagesMap.VKeys(true).map(id=>GetImage(parseInt(id))) : []);
});
