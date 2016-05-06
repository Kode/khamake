import {Color} from './Color';

export class Asset {
	name: string;
	scale: number;
	background: Color;
	width: number;
	height: number;
	original_width: number;
	original_height: number;
	
	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}
}
