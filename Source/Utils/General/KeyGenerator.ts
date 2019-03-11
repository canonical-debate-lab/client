// import uuidV4 from 'uuid/v4';
import slugid from 'slugid';

export function GenerateUUID(): string {
	// return uuidV4(options);
	return slugid.v4();
}
