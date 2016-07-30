"use strict";

let myInfo = function (text: string) {
	console.log(text);
};

let myError = function (text: string) {
	console.log(text);
};

export function set(log: {info: (n: string) => void, error: (n: string) => void}) {
	myInfo = log.info;
	myError = log.error;
}

export function silent() {
	myInfo = function () {};
	myError = function () {};
}

export function info(text: string) {
	myInfo(text);
}

export function error(text: string) {
	myError(text);
}
