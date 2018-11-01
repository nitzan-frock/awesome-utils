// (c) 2018, The Awesome Engineering Company, https://awesomeneg.com

"use strict";

const HTTP = require("http");
const HTTPS = require("https");

const ObjectUtils = require("./Object");

class RequestUtils {
	request(method,url,contentType=null,content=null,headers={},options={}) {
		if (arguments.length===1) [method,url,contentType,content,headers] = ["get",method,null,null,headers];

		if (!method) throw new Error("Missing method.");
		if (typeof method!=="string") throw new Error("Invalid method.");
		if (!url) throw new Error("Missing url.");
		if (typeof url!=="string") throw new Error("Invalid url.");
		if (contentType && typeof contentType!=="string") throw new Error("Invalid contentType.");
		if (headers && typeof headers!=="object") throw new Error("Invalid headers.");
		if (options && typeof options!=="object") throw new Error("Invalid options.");

		return new Promise((resolve,reject)=>{
			try {
				if (contentType && content && contentType==="application/json" && typeof content!=="string" && !(content instanceof Buffer)) content = JSON.stringify(content);

				let channel = HTTPS;
				if (url.startsWith("http:")) channel = HTTP;

				headers = ObjectUtils.extend({},headers||{});
				if (contentType) headers["Content-Type"] = contentType;

				options = ObjectUtils.extend({
					method: method
				},options||{});

				let request = channel.request(url,options,(response)=>{
					// sets up the content getter.
					createContentGetter(response);

					resolve(response);
				});
				request.once("error",(err)=>{
					reject(err);
				});
				if (content) request.write(content);
				request.end();
			}
			catch (ex) {
				return reject(ex);
			}
		});
	}

	get(url,headers={},options={}) {
		return this.request("get",url,null,null,headers,options);
	}

	post(url,contentType,content,headers={},options={}) {
		return this.request("post",url,contentType,content,headers,options);
	}

	put(url,contentType,content,headers={},options={}) {
		return this.request("put",url,contentType,content,headers,options);
	}

	delete(url,headers={},options={}) {
		return this.request("delete",url,null,null,headers,options);
	}

	head(url,headers={},options={}) {
		return this.request("head",url,null,null,headers,options);
	}

	connect(url,contentType,content,headers={},options={}) {
		return this.request("connect",url,contentType,content,headers,options);
	}

	options(url,contentType,content,headers={},options={}) {
		return this.request("options",url,contentType,content,headers,options);
	}

	trace(url,headers={},options={}) {
		return this.request("trace",url,null,null,headers,options);
	}

	patch(url,contentType,content,headers={},options={}) {
		return this.request("path",url,contentType,content,headers,options);
	}
}

const createContentGetter = function createContentGetter(response) {
	let contentType = response.headers && response.headers["Content-Type"] || "application/octet-stream";

	let error = undefined;
	let content = undefined;
	Object.defineProperty(response,"content",{
		get: function() {
			if (error) return Promise.reject(content);
			if (content!==undefined) return Promise.resolve(content);

			return new Promise((resolve,reject)=>{
				try {
					let buffer = Buffer.alloc(0);
					response.once("error",(err)=>{
						error = err;
						reject(error);
					});
					response.on("data",(chunk)=>{
						buffer = Buffer.concat([buffer,chunk]);
					});
					response.once("end",()=>{
						if (contentType==="application/json") {
							try {
								buffer = JSON.parse(buffer);
							}
							catch (ex) {
								error = ex;
								return reject(error);
							}
						}
						if (contentType.startsWith("text/")) buffer = buffer.toString();

						content = buffer;
						resolve(content);
					});
				}
				catch (ex) {
					return reject(ex);
				}
			});
		}
	});
};

module.exports = new RequestUtils();
