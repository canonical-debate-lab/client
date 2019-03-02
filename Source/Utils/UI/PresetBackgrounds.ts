export type BackgroundConfig = {color?: string, url_1920?: string, url_3840?: string, position?: string};

export const presetBackgrounds = {
	1: {
		color: '#E5E8EC',
	},
	2: {
		url_1920: 'https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FOcean_x1920.jpg?alt=media&token=53fc5864-a6de-431b-a724-fe4f9305f336',
		url_3840: 'https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FOcean_x3840.jpg?alt=media&token=2d1c25f3-a25e-4cb4-8586-06f419e4d63c',
		position: 'center bottom',
	},
	3: {
		url_1920: 'https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FNebula_x1920.jpg?alt=media&token=f2fec09e-7394-4453-a08e-7f8608553e14',
		url_3840: 'https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FNebula_x2560.jpg?alt=media&token=c4ed8a83-d9ed-410f-9ae1-1d830355349a',
	},
} as any as {[key: string]: BackgroundConfig};
