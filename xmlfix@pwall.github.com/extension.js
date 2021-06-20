const { GLib } = imports.gi;
const NotificationDaemon = imports.ui.notificationDaemon;
const Params = imports.misc.params;

const { NotificationClosedReason, Urgency, rewriteRules } = NotificationDaemon;

const prototype = NotificationDaemon.FdoNotificationDaemon.prototype;

const xmlEntities = [
	["34", '"'],
	["38", "&"],
	["39", "'"],
	["60", "<"],
	["62", ">"],
];

const newNotifyAsync = function (params, invocation) {
	let [appName, replacesId, icon, summary, body, actions, hints, timeout] = params;
	let id;

	for (let hint in hints) {
		hints[hint] = hints[hint].deep_unpack();
	}

	hints = Params.parse(hints, { urgency: Urgency.NORMAL }, true);

	if (appName == "Empathy" && hints["category"] == "im.received") {
		id = this._nextNotificationId++;
		let idleId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
			this._emitNotificationClosed(
				id,
				NotificationClosedReason.DISMISSED
			);
			return GLib.SOURCE_REMOVE;
		});
		GLib.Source.set_name_by_id(
			idleId,
			"[gnome-shell] this._emitNotificationClosed"
		);
		return invocation.return_value(GLib.Variant.new("(u)", [id]));
	}

	let rewrites = rewriteRules[appName];
	if (rewrites) {
		for (let i = 0; i < rewrites.length; i++) {
			let rule = rewrites[i];
			if (summary.search(rule.pattern) != -1)
				summary = summary.replace(rule.pattern, rule.replacement);
		}
	}

	for (let i = 0; i < xmlEntities.length; i++) {
		const [number, character] = xmlEntities[i];
		body = body.replaceAll(`&#${number};`, character);
	}

	if (!hints["image-path"] && hints["image_path"])
		hints["image-path"] = hints["image_path"];

	if (!hints["image-data"]) {
		if (hints["image_data"]) hints["image-data"] = hints["image_data"];
		else if (hints["icon_data"] && !hints["image-path"])
			hints["image-data"] = hints["icon_data"];
	}

	let ndata = { appName, icon, summary, body, actions, hints, timeout };
	if (replacesId != 0 && this._notifications[replacesId]) {
		ndata.id = id = replacesId;
		ndata.notification = this._notifications[replacesId].notification;
	} else {
		replacesId = 0;
		ndata.id = id = this._nextNotificationId++;
	}
	this._notifications[id] = ndata;

	let sender = invocation.get_sender();
	let pid = hints["sender-pid"];

	let source = this._getSource(appName, pid, ndata, sender, null);
	this._notifyForSource(source, ndata);

	return invocation.return_value(GLib.Variant.new("(u)", [id]));
};

class Extension {
	constructor() {
	}

	enable() {
		this.original = prototype.NotifyAsync;
		prototype.NotifyAsync = newNotifyAsync;
	}

	disable() {
		prototype.NotifyAsync = this.original;
	}
}

function init() {
	return new Extension();
}
