import { CachedTransform } from 'js-vextensions';
import { GetData, GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Term } from './terms/@Term';
import { Image } from './images/@Image';

export function GetImage(id: number) {
	if (id == null || IsNaN(id)) return null;
	return GetData('images', id) as Image;
}
/* export async function GetImageAsync(id: number) {
	return await GetDataAsync(`images/${id}`) as Image;
} */

export function GetImages(): Image[] {
	const imagesMap = GetData({ collection: true }, 'images');
	return CachedTransform('GetImages', [], imagesMap, () => (imagesMap ? imagesMap.VValues(true) : []));
	// return CachedTransform("GetImages", {}, imagesMap, ()=>imagesMap ? imagesMap.VKeys(true).map(id=>GetImage(parseInt(id))) : []);
}
