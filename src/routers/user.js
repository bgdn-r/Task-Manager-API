const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");

const router = new express.Router();

// NOTE Signup
router.post("/users", async (req, res) => {
	const user = new User(req.body);

	try {
		await user.save();
		sendWelcomeEmail(user.name, user.email);
		const token = await user.generateAuthToken();
		res.send({ user: user, token: token });
	} catch (err) {
		res.status(500).send();
	}
});

// NOTE Login
router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);

		const token = await user.generateAuthToken();

		res.send({ user: user, token: token });
	} catch (err) {
		res.status(400).send();
	}
});

// NOTE Logout
router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});

		await req.user.save();

		res.send();
	} catch (err) {
		res.status(500).send(err);
	}
});

// NOTE Logout all users
router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(500).send(err);
	}
});

// NOTE Get all users
router.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});

// NOTE Update specific user
router.patch("/users/me", auth, async (req, res) => {
	const allowedUpdates = ["name", "email", "password", "age"];
	const updates = Object.keys(req.body);
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		return res.status(400).send({ error: `Invalid updates` });
	}

	try {
		updates.forEach((update) => (req.user[update] = req.body[update]));
		await req.user.save();

		res.status(200).send(req.user);
	} catch (err) {
		res.status(400).send(err);
	}
});

// NOTE Delete specific user
router.delete("/users/me", auth, async (req, res) => {
	try {
		await req.user.remove();
		sendCancelationEmail(req.user.name, req.user.email);

		res.status(200).send(req.user);
	} catch (err) {
		res.status(500).send();
	}
});

// NOTE Multer setup for uploading
const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error("Please provide a valid file format ( .jpg .jpeg .png )"));
		}

		cb(undefined, true);
	},
});

// NOTE Upload image
router.post(
	"/users/me/avatar",
	auth,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

// NOTE Delete image
router.delete("/users/me/avatar", auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.status(200).send();
});

// NOTE View image in browser
router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error("Could not find user or users image");
		}

		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
});

module.exports = router;
