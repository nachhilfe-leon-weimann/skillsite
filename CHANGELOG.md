# Changelog

## [1.2.4](https://github.com/nachhilfe-leon-weimann/skillsite/compare/v1.2.3...v1.2.4) (2026-11-08)


### Bug Fixes

* **a11y:** keep focus on a select's trigger while its list closes ([#258](https://github.com/nachhilfe-leon-weimann/skillsite/issues/258)) ([36e838b](https://github.com/nachhilfe-leon-weimann/skillsite/commit/36e838b92291fc8a9cbf7cd3a4348a88e9b06daf))
* **a11y:** move focus and announce the outcome on the booker's step changes ([#256](https://github.com/nachhilfe-leon-weimann/skillsite/issues/256)) ([5057c58](https://github.com/nachhilfe-leon-weimann/skillsite/commit/5057c5823ea840d2e4b5d63be5798ee0ad6de41f))
* **a11y:** refocus a dialog's select trigger after an outside press ([#257](https://github.com/nachhilfe-leon-weimann/skillsite/issues/257)) ([b91b243](https://github.com/nachhilfe-leon-weimann/skillsite/commit/b91b24362f932f580943f0878ec43d7c83fed36e))
* **booking:** allow-list durations and record checked agreements ([#253](https://github.com/nachhilfe-leon-weimann/skillsite/issues/253)) ([8b11ad8](https://github.com/nachhilfe-leon-weimann/skillsite/commit/8b11ad85485dc78acced312cb8583e0eb669c106))
* **booking:** bound the rate-limit map and forget expired addresses ([#255](https://github.com/nachhilfe-leon-weimann/skillsite/issues/255)) ([9c704ff](https://github.com/nachhilfe-leon-weimann/skillsite/commit/9c704ff9fb4dab4536e78d5aabc028cbfc870092))
* **booking:** time out the Cal.com booking and redact its errors ([#252](https://github.com/nachhilfe-leon-weimann/skillsite/issues/252)) ([9cbc840](https://github.com/nachhilfe-leon-weimann/skillsite/commit/9cbc8403788f0d88109f8433966f8f5bc57d4737))
* **ui:** keep the German separators in CountUp ([#249](https://github.com/nachhilfe-leon-weimann/skillsite/issues/249)) ([6f50c38](https://github.com/nachhilfe-leon-weimann/skillsite/commit/6f50c3829fa490987d64ab11a476921a808f7c17))

## [1.2.3](https://github.com/nachhilfe-leon-weimann/skillsite/compare/v1.2.2...v1.2.3) (2026-11-06)


### Bug Fixes

* **booking:** accept only an offered event key ([#239](https://github.com/nachhilfe-leon-weimann/skillsite/issues/239)) ([b0ec00f](https://github.com/nachhilfe-leon-weimann/skillsite/commit/b0ec00f86e767d62bdb67716652ea4a183bd6234))
* **errors:** render root layout errors in the site's look ([#221](https://github.com/nachhilfe-leon-weimann/skillsite/issues/221)) ([a301c3f](https://github.com/nachhilfe-leon-weimann/skillsite/commit/a301c3f472eab3b86d3e2a022b562970793197ae))
* **errors:** retry the failed segment from the error page ([#222](https://github.com/nachhilfe-leon-weimann/skillsite/issues/222)) ([9654361](https://github.com/nachhilfe-leon-weimann/skillsite/commit/9654361284bd70faffd65caa375c386c6bacd9a1))

## [1.2.2](https://github.com/nachhilfe-leon-weimann/skillsite/compare/v1.2.1...v1.2.2) (2026-11-04)


### Bug Fixes

* **a11y:** build select on radix ([#206](https://github.com/nachhilfe-leon-weimann/skillsite/issues/206)) ([249bb43](https://github.com/nachhilfe-leon-weimann/skillsite/commit/249bb43f2fb0bea748f3f54928940168efccf379))
* **a11y:** contain focus in the mobile navigation ([#205](https://github.com/nachhilfe-leon-weimann/skillsite/issues/205)) ([3b6bbf5](https://github.com/nachhilfe-leon-weimann/skillsite/commit/3b6bbf5574e9e4535b38856715999d2a3e864516))
* **a11y:** dismiss the desktop navigation with radix ([#204](https://github.com/nachhilfe-leon-weimann/skillsite/issues/204)) ([21cab37](https://github.com/nachhilfe-leon-weimann/skillsite/commit/21cab37b901f56871bf649f515c3fe325e221703))
* **a11y:** give booking choices a radio keyboard model ([#207](https://github.com/nachhilfe-leon-weimann/skillsite/issues/207)) ([7b4743f](https://github.com/nachhilfe-leon-weimann/skillsite/commit/7b4743f0124c4dce249fb3400dda0c69a5a49375))
* **a11y:** navigate the booking calendar by keyboard ([#209](https://github.com/nachhilfe-leon-weimann/skillsite/issues/209)) ([a773979](https://github.com/nachhilfe-leon-weimann/skillsite/commit/a77397925ccea41a2b723c3daf295785b2bd9505))
* **booking:** hydrate the calendar with the server's day ([#217](https://github.com/nachhilfe-leon-weimann/skillsite/issues/217)) ([7b48f0f](https://github.com/nachhilfe-leon-weimann/skillsite/commit/7b48f0fe4cf3569d62b4a4892cce1a9ac07d8c45))

## [1.2.1](https://github.com/nachhilfe-leon-weimann/skillsite/compare/v1.2.0...v1.2.1) (2026-11-03)


### Bug Fixes

* **a11y:** let the subject cards on /faecher follow the page heading ([#163](https://github.com/nachhilfe-leon-weimann/skillsite/issues/163)) ([3ec0497](https://github.com/nachhilfe-leon-weimann/skillsite/commit/3ec049763c1c66c541523489abf3deb830c32e5e))
* **a11y:** manage dialog focus with radix ([#189](https://github.com/nachhilfe-leon-weimann/skillsite/issues/189)) ([7cb9188](https://github.com/nachhilfe-leon-weimann/skillsite/commit/7cb918884a3473085715b9064a78ce7cbea360e9))
* **a11y:** name the controls, mark the current page and close the menu with Escape ([#155](https://github.com/nachhilfe-leon-weimann/skillsite/issues/155)) ([cb58c37](https://github.com/nachhilfe-leon-weimann/skillsite/commit/cb58c37340282ee50acabd51cdcd1f633366ace8))
* animate the panels, close the navbar gap and land anchors below the header ([#153](https://github.com/nachhilfe-leon-weimann/skillsite/issues/153)) ([71a0286](https://github.com/nachhilfe-leon-weimann/skillsite/commit/71a0286f55403fce8d6f0c93cca200155fe4d04a))
* **links:** navigate internal text links without a page load ([#175](https://github.com/nachhilfe-leon-weimann/skillsite/issues/175)) ([8a31aac](https://github.com/nachhilfe-leon-weimann/skillsite/commit/8a31aacd0a107aa13ba66f6f9cc4ee3a028ef248))
* **seo:** drop the inherited canonical and route every page through pageMetadata ([#154](https://github.com/nachhilfe-leon-weimann/skillsite/issues/154)) ([97c7a6d](https://github.com/nachhilfe-leon-weimann/skillsite/commit/97c7a6d7ab4f5b14b8dfb99c65096cc21530b6f4))
* **ui:** keep theme tokens when merging classes ([#152](https://github.com/nachhilfe-leon-weimann/skillsite/issues/152)) ([c6102e2](https://github.com/nachhilfe-leon-weimann/skillsite/commit/c6102e27d17dfeb89f68c176704a53e8fe64f253))

## [1.2.0](https://github.com/Nachhilfe-Leon-Weimann/skillsite/compare/v1.1.7...v1.2.0) (2026-09-21)


### Features

* **health:** report the version ([#128](https://github.com/Nachhilfe-Leon-Weimann/skillsite/issues/128)) ([568a689](https://github.com/Nachhilfe-Leon-Weimann/skillsite/commit/568a68912e7922d9591c2e73fafc91f252f24c4f))
