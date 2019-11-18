import { CachedTransform, IsNaN } from 'js-vextensions';
import { GetData, GetDataAsync, StoreAccessor } from 'Utils/FrameworkOverrides';
import { Term } from './terms/@Term';

export const GetTerm = StoreAccessor((id: string) => {
	if (id == null || IsNaN(id)) return null;
	return GetData('terms', id) as Term;
});
export async function GetTermAsync(id: string) {
	return await GetDataAsync('terms', id) as Term;
}

export const GetTerms = StoreAccessor((): Term[] => {
	const termsMap = GetData({ collection: true }, 'terms');
	return CachedTransform('GetTerms', [], termsMap, () => (termsMap ? termsMap.VValues(true) : []));
	// return CachedTransform("GetTerms", {}, termsMap, ()=>termsMap ? termsMap.VKeys(true).map(id=>GetTerm(parseInt(id))) : []);
});

// "P" stands for "pure" (though really means something like "pure + synchronous")
export function GetFullNameP(term: Term) {
	return term.name + (term.disambiguation ? ` (${term.disambiguation})` : '');
}

export const GetTermVariantNumber = StoreAccessor((term: Term): number => {
	const termsWithSameName_map = GetData('termNames', term.name);
	if (termsWithSameName_map == null) return 1;
	const termsWithSameNameAndLowerIDs = termsWithSameName_map.VKeys(true).map(a => a).filter(a => a < term._key);
	return 1 + termsWithSameNameAndLowerIDs.length;
});
