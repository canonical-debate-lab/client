import { CachedTransform } from 'js-vextensions';
import {GetData, GetDataAsync} from 'Utils/FrameworkOverrides';
import { Term } from './terms/@Term';

export function GetTerm(id: number) {
	if (id == null || IsNaN(id)) return null;
	return GetData('terms', id) as Term;
}
export async function GetTermAsync(id: number) {
	return await GetDataAsync('terms', id) as Term;
}

export function GetTerms(): Term[] {
	const termsMap = GetData({ collection: true }, 'terms');
	return CachedTransform('GetTerms', [], termsMap, () => (termsMap ? termsMap.VValues(true) : []));
	// return CachedTransform("GetTerms", {}, termsMap, ()=>termsMap ? termsMap.VKeys(true).map(id=>GetTerm(parseInt(id))) : []);
}

// "P" stands for "pure" (though really means something like "pure + synchronous")
export function GetFullNameP(term: Term) {
	return term.name + (term.disambiguation ? ` (${term.disambiguation})` : '');
}

export function GetTermVariantNumber(term: Term): number {
	const termsWithSameName_map = GetData('termNames', term.name);
	if (termsWithSameName_map == null) return 1;
	const termsWithSameNameAndLowerIDs = termsWithSameName_map.VKeys(true).map(a => a.ToInt()).filter(a => a < term._id);
	return 1 + termsWithSameNameAndLowerIDs.length;
}
