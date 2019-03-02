import {GetData, GetData_Options} from 'Utils/FrameworkOverrides';
import { ViewedNodeSet } from './userViewedNodes/@ViewedNodeSet';

export function GetUserViewedNodes(userID: string, options?: GetData_Options) {
	if (userID == null) return null;
	return GetData(options, 'userViewedNodes', userID) as ViewedNodeSet;
}
