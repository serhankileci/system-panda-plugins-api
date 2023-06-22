import { Schema, model, connect } from "mongoose";

const semverRegex =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const pluginSchema = new Schema({
	title: {
		type: String,
		required: true,
		unique: true,
		minlength: 3,
		maxlength: 30,
		validate: {
			message: "Invalid title format.",
			validator: value => /^[\w\s]+$/.test(value),
		},
	},
	version: {
		type: String,
		default: "0.1.0",
		validate: {
			message: "Version must have semver versioning format.",
			validator: value => semverRegex.test(value),
		},
	},
	author: {
		type: String,
		required: true,
		minlength: 3,
		maxlength: 30,
	},
	description: {
		type: String,
		default: "No description.",
		minlength: 3,
		maxlength: 1000,
	},
	sourceCode: {
		type: String,
		required: true,
		validate: {
			message: "At this stage, sourceCode size cannot exceed 10MB.",
			validator: value => value.length <= 10 * 1024 * 1024,
		},
	},
});

const Plugin = model("Plugin", pluginSchema);
await connect(process.env.DB_URL);

export const handler = async (event, context) => {
	try {
		const { path, method } = event.requestContext?.http;

		if (method === "GET") {
			if (path.startsWith("/plugins/")) {
				try {
					const title = path.substring(path.lastIndexOf("/") + 1);
					const plugin = await Plugin.findOne({ title }).select("-__v -_id");
					if (!plugin) throw Error("Plugin not found.");
					return {
						statusCode: 200,
						body: JSON.stringify(plugin),
					};
				} catch (err) {
					console.error(err);
					return {
						statusCode: 500,
						body: JSON.stringify(err),
					};
				}
			} else if (path === "/plugins") {
				try {
					const plugins = await Plugin.find().select("-__v -_id");
					return {
						statusCode: 200,
						body: JSON.stringify(plugins),
					};
				} catch (err) {
					console.error(err);
					return {
						statusCode: 500,
						body: JSON.stringify(err),
					};
				}
			}
		} else if (method === "POST") {
			if (path === "/plugins") {
				try {
					const plugin = JSON.parse(event.body);
					const createdPlugin = await Plugin.create(plugin);
					return {
						statusCode: 200,
						body: JSON.stringify({
							title: createdPlugin.title,
							message: `Plugin created.`,
						}),
					};
				} catch (err) {
					console.error(err);
					return {
						statusCode: 500,
						body: JSON.stringify(err),
					};
				}
			}
		} /* else if (method === "PUT") {
			if (path.startsWith("/plugins/")) {
				const id = path.substring(path.lastIndexOf("/") + 1);
				try {
					const plugin = JSON.parse(event.body);
					const updatedPlugin = await Plugin.findByIdAndUpdate(id, plugin, { new: true });
					if (!updatedPlugin) throw Error("Plugin not found.");
					return {
						statusCode: 200,
						body: JSON.stringify({ ...updatedPlugin.id, message: `Plugin "${updatedPlugin.title}" updated.`}),
					};
				} catch (err) {
					console.error(err);
					return {
						statusCode: 500,
						body: JSON.stringify(err),
					};
				}
			}
		} else if (method === "DELETE") {
			if (path.startsWith("/plugins/")) {
				const id = path.substring(path.lastIndexOf("/") + 1);
				try {
					const deletedPlugin = await Plugin.findByIdAndDelete(id);
					if (!deletedPlugin) throw Error("Plugin not found.");
					return {
						statusCode: 200,
						body: JSON.stringify({ message: `Plugin "${deletedPlugin.title}" deleted.` }),
					};
				} catch (err) {
					console.error(err);
					return {
						statusCode: 500,
						body: JSON.stringify(err),
					};
				}
			}
		}*/

		return {
			statusCode: 404,
			body: JSON.stringify({
				message: `Route "${path}" with method "${method}" not found.`,
			}),
		};
	} catch (err) {
		console.error(
			"****************************************",
			err,
			event,
			context,
			"****************************************"
		);
		return {
			statusCode: 500,
			body: JSON.stringify(err),
		};
	}
};
