import { CachedTransform, IsNaN } from 'js-vextensions';
import { GetData, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Term } from './terms/@Term';
import { TermComponent } from './termComponents/@TermComponent';

export function GetTermComponent(id: string) {
	if (id == null || IsNaN(id)) return null;
	return GetData('termComponents', id) as TermComponent;
}
export async function GetTermComponentAsync(id: string) {
	return await GetDataAsync('termComponents', id) as TermComponent;
}

export function GetTermComponents(term: Term) {
	const components = (term.components || {}).VKeys(true).map(id => GetTermComponent(id));
	return CachedTransform('GetTermComponents', [term._key], components, () => components);
}
export async function GetTermComponentsAsync(term: Term) {
	return await Promise.all(term.components.VKeys(true).map(id => GetDataAsync('termComponents', id))) as TermComponent[];
}
