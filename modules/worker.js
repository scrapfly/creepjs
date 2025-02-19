export const getBestWorkerScope = async imports => {	
	const {
		require: {
			queueEvent,
			createTimer,
			getOS,
			decryptUserAgent,
			captureError,
			phantomDarkness,
			getUserAgentPlatform,
			documentLie,
			logTestResult,
			compressWebGLRenderer,
			getWebGLRendererConfidence,
			isUAPostReduction
		}
	} = imports
	try {
		const timer = createTimer()
		await queueEvent(timer)

		const ask = fn => { try { return fn() } catch (e) { return } }
		const resolveWorkerData = (target, resolve, fn) => target.addEventListener('message', event => {
			fn(); return resolve(event.data)
		})
		const hasConstructor = (x, name) => x && x.__proto__.constructor.name == name
		const getDedicatedWorker = ({ scriptSource }) => new Promise(resolve => {
			const dedicatedWorker = ask(() => new Worker(scriptSource))
			if (!hasConstructor(dedicatedWorker, 'Worker')) return resolve()
			return resolveWorkerData(dedicatedWorker, resolve, () => dedicatedWorker.terminate())
		})
		const getSharedWorker = ({ scriptSource }) => new Promise(resolve => {
			const sharedWorker = ask(() => new SharedWorker(scriptSource))
			if (!hasConstructor(sharedWorker, 'SharedWorker')) return resolve()
			sharedWorker.port.start()
			return resolveWorkerData(sharedWorker.port, resolve, () => sharedWorker.port.close())
		})
		const getServiceWorker = ({ scriptSource }) => new Promise(resolve => {
			if (!ask(() => navigator.serviceWorker.register)) return resolve()
			return navigator.serviceWorker.register(scriptSource).then(registration => {
				if (!hasConstructor(registration, 'ServiceWorkerRegistration')) return resolve()
				return navigator.serviceWorker.ready.then(registration => {
					registration.active.postMessage(undefined)
					return resolveWorkerData(
						navigator.serviceWorker,
						resolve,
						() => registration.unregister()
					)
				})
			}).catch(error => {
				console.error(error)
				return resolve()
			})
			
		})

		const scriptSource = 'creepworker.js'
		let scope = 'ServiceWorkerGlobalScope'
		let type = 'service' // loads fast but is not available in frames
		let workerScope = await getServiceWorker({ scriptSource }).catch(error => {
			captureError(error)
			console.error(error.message)
			return
		})
		if (!(workerScope || {}).userAgent) {
			scope = 'SharedWorkerGlobalScope'
			type = 'shared' // no support in Safari, iOS, and Chrome Android
			workerScope = await getSharedWorker({ scriptSource }).catch(error => {
				captureError(error)
				console.error(error.message)
				return
			})
		}
		if (!(workerScope || {}).userAgent) {
			scope = 'WorkerGlobalScope'
			type = 'dedicated' // simulators & extensions can spoof userAgent
			workerScope = await getDedicatedWorker({ scriptSource }).catch(error => {
				captureError(error)
				console.error(error.message)
				return
			})
		}
		if (!(workerScope || {}).userAgent) {
			return
		}
		const { canvas2d } = workerScope || {}
		workerScope.system = getOS(workerScope.userAgent)
		workerScope.device = getUserAgentPlatform({ userAgent: workerScope.userAgent })
		workerScope.canvas2d = { dataURI: canvas2d }
		workerScope.type = type
		workerScope.scope = scope

		// detect lies 
		const {
			fontSystemClass,
			system,
			userAgent,
			userAgentData,
			platform
		} = workerScope || {}
		
		// font system lie
		const fontSystemLie = fontSystemClass && (
			/^((i(pad|phone|os))|mac)$/i.test(system) && fontSystemClass != 'Apple'  ? true :
				/^(windows)$/i.test(system) && fontSystemClass != 'Windows'  ? true :
					/^(linux|chrome os)$/i.test(system) && fontSystemClass != 'Linux'  ? true :
						/^(android)$/i.test(system) && fontSystemClass != 'Android'  ? true :
							false
		)
		if (fontSystemLie) {
			workerScope.lied = true
			workerScope.lies.systemFonts = `${fontSystemClass} fonts and ${system} user agent do not match`
			documentLie(workerScope.scope, workerScope.lies.systemFonts)
		}

		// prototype lies
		if (workerScope.lies.proto) {
			const { proto } = workerScope.lies
			const keys = Object.keys(proto)
			keys.forEach(key => {
				const api = `${workerScope.scope}.${key}`
				const lies = proto[key]
				lies.forEach(lie => documentLie(api, lie))
			})
			
		}
		
		// user agent os lie
		const userAgentOS = (
			// order is important
			/win(dows|16|32|64|95|98|nt)|wow64/ig.test(userAgent) ? 'Windows' :
				/android|linux|cros/ig.test(userAgent) ? 'Linux' :
					/(i(os|p(ad|hone|od)))|mac/ig.test(userAgent) ? 'Apple' :
						'Other'
		)
		const platformOS = (
			// order is important
			/win/ig.test(platform) ? 'Windows' :
				/android|arm|linux/ig.test(platform) ? 'Linux' :
					/(i(os|p(ad|hone|od)))|mac/ig.test(platform) ? 'Apple' :
						'Other'
		)
		const osLie = userAgentOS != platformOS
		if (osLie) {
			workerScope.lied = true
			workerScope.lies.os = `${platformOS} platform and ${userAgentOS} user agent do not match`
			documentLie(workerScope.scope, workerScope.lies.os)
		}

		// user agent engine lie
		const decryptedName = decryptUserAgent({
			ua: userAgent,
			os: system,
			isBrave: false // default false since we are only looking for JS runtime and version
		})
		const userAgentEngine = (
			(/safari/i.test(decryptedName) || /iphone|ipad/i.test(userAgent)) ? 'JavaScriptCore' :
				/firefox/i.test(userAgent) ? 'SpiderMonkey' :
					/chrome/i.test(userAgent) ? 'V8' :
						undefined
		)
		const jsRuntimeEngine = {
			'1.9275814160560204e-50': 'V8',
			'1.9275814160560185e-50': 'SpiderMonkey',
			'1.9275814160560206e-50': 'JavaScriptCore'
		}
		const mathPI = 3.141592653589793
		const engine = jsRuntimeEngine[mathPI ** -100]
		if (userAgentEngine != engine) {
			workerScope.lied = true
			workerScope.lies.engine = `${engine} JS runtime and ${userAgentEngine} user agent do not match`
			documentLie(workerScope.scope, workerScope.lies.engine)
		}
		// user agent version lie
		const getVersion = x => /\s(\d+)/i.test(x) && /\s(\d+)/i.exec(x)[1]
		const userAgentVersion = getVersion(decryptedName)
		const userAgentDataVersion = (
			userAgentData &&
			userAgentData.brandsVersion &&
			userAgentData.brandsVersion.length ? 
			getVersion(userAgentData.brandsVersion) :
			undefined
		)
		const versionSupported = userAgentDataVersion && userAgentVersion
		const versionMatch = userAgentDataVersion == userAgentVersion
		if (versionSupported && !versionMatch) {
			workerScope.lied = true
			workerScope.lies.version = `userAgentData version ${userAgentDataVersion} and user agent version ${userAgentVersion} do not match`
			documentLie(workerScope.scope, workerScope.lies.version)
		}

		// windows platformVersion lie
		// https://docs.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11
		const getWindowsVersionLie = (device, userAgentData) => {
			if (!/windows/i.test(device) || !userAgentData) {
				return false
			}
			const reportedVersionNumber = +(/windows ([\d|\.]+)/i.exec(device)||[])[1]
			const windows1OrHigherReport = reportedVersionNumber == 10
			const { platformVersion, brandsVersion } = userAgentData

			// userAgentData version format changed in Chrome 95
			// https://github.com/WICG/ua-client-hints/issues/220#issuecomment-870858413
			const chrome95AndAbove = (
				((3.141592653589793 ** -100) == 1.9275814160560204e-50) && CSS.supports('app-region: initial')
			)
			const versionMap = {
				'6.1': '7',
				'6.1.0': '7',
				'6.2': '8',
				'6.2.0': '8',
				'6.3': '8.1',
				'6.3.0': '8.1',
				'10.0': '10',
				'10.0.0': '10'
			}
			let versionNumber = versionMap[platformVersion]
			if (!chrome95AndAbove && versionNumber) {
				return versionNumber != (''+reportedVersionNumber)
			}
			versionNumber = +(/(\d+)\./.exec(''+platformVersion)||[])[1]
			const windows10OrHigherPlatform = versionNumber > 0
			return (
				(windows10OrHigherPlatform && !windows1OrHigherReport) ||
				(!windows10OrHigherPlatform && windows1OrHigherReport)
			)
		}
		const windowsVersionLie  = getWindowsVersionLie(workerScope.device, userAgentData)
		if (windowsVersionLie) {
			workerScope.lied = true
			workerScope.lies.platformVersion = `Windows platformVersion ${(userAgentData||{}).platformVersion} does not match user agent version ${workerScope.device}`
			documentLie(workerScope.scope, workerScope.lies.platformVersion)
		}			
		
		// capture userAgent version
		workerScope.userAgentVersion = userAgentVersion
		workerScope.userAgentDataVersion = userAgentDataVersion
		workerScope.userAgentEngine = userAgentEngine

		const gpu = {
			...(getWebGLRendererConfidence(workerScope.webglRenderer) || {}),
			compressedGPU: compressWebGLRenderer(workerScope.webglRenderer)
		}
		
		logTestResult({ time: timer.stop(), test: `${type} worker`, passed: true })
		return {
			...workerScope,
			gpu,
			uaPostReduction: isUAPostReduction(workerScope.userAgent)
		}
	}
	catch (error) {
		logTestResult({ test: 'worker', passed: false })
		captureError(error, 'workers failed or blocked by client')
		return
	}
}

export const workerScopeHTML = ({ fp, note, count, modal, hashMini, hashSlice, computeWindowsRelease, performanceLogger, formatEmojiSet }) => {
	if (!fp.workerScope) {
		return `
		<div class="col-six undefined">
			<strong>Worker</strong>
			<div>keys (0): ${note.blocked}</div>
			<div>permissions (0): ${note.blocked}</div>
			<div>codecs (0):${note.blocked}</div>
			<div>canvas 2d: ${note.blocked}</div>
			<div>fonts (0): ${note.blocked}</div>
			<div class="block-text-large">${note.blocked}</div>
			<div>gpu:</div>
			<div class="block-text">${note.blocked}</div>
		</div>
		<div class="col-six undefined">
			<div>lang: ${note.blocked}</div>
			<div>timezone: ${note.blocked}</div>
			<div>device:</div>
			<div class="block-text">${note.blocked}</div>
			<div>userAgent:</div>
			<div class="block-text">${note.blocked}</div>
			<div>userAgentData:</div>
			<div class="block-text">${note.blocked}</div>
		</div>`
	}
	const { workerScope: data } = fp

	const {
		scopeKeys,
		lied,
		locale,
		systemCurrencyLocale,
		engineCurrencyLocale,
		localeEntropyIsTrusty,
		localeIntlEntropyIsTrusty,
		timezoneOffset,
		timezoneLocation,
		deviceMemory,
		hardwareConcurrency,
		language,
		languages,
		mediaCapabilities,
		platform,
		userAgent,
		uaPostReduction,
		permissions,
		canvas2d,
		textMetricsSystemSum,
		textMetricsSystemClass,
		webglRenderer,
		webglVendor,
		gpu,
		fontFaceLoadFonts,
		fontSystemClass,
		fontListLen,
		fontPlatformVersion,
		fontApps,
		emojiSet,
		emojiFonts,
		userAgentData,
		type,
		scope,
		system,
		device,
		$hash
	} = data || {}

	const codecKeys = Object.keys(mediaCapabilities || {})
	const permissionsKeys = Object.keys(permissions || {})
	const permissionsGranted = (
		permissions && permissions.granted ? permissions.granted.length : 0
	)

	const {
		parts,
		warnings,
		gibbers,
		confidence,
		grade: confidenceGrade,
		compressedGPU
	} = gpu || {}

	const fontFaceLoadHash = hashMini(fontFaceLoadFonts)
	const blockHelpTitle = `FontFace.load()\nOffscreenCanvasRenderingContext2D.measureText()\nhash: ${hashMini(emojiSet)}\n${(emojiSet||[]).map((x,i) => i && (i % 6 == 0) ? `${x}\n` : x).join('')}`
	return `
	<span class="time">${performanceLogger.getLog()[`${type} worker`]}</span>
	<span class="aside-note-bottom">${scope || ''}</span>
	<div class="relative col-six${lied ? ' rejected' : ''}">
		
		<strong>Worker</strong><span class="hash">${hashSlice($hash)}</span>
		<div>keys (${count(scopeKeys)}): ${
			scopeKeys && scopeKeys.length ? modal(
				'creep-worker-scope-version',
				scopeKeys.join(', '),
				hashMini(scopeKeys)
			) : note.blocked
		}</div>
		<div class="help" title="Permissions.query()">permissions (${''+permissionsGranted}): ${
			!permissions || !permissionsKeys ? note.unsupported : modal(
				'creep-worker-permissions',
				permissionsKeys.map(key => `<div class="perm perm-${key}"><strong>${key}</strong>:<br>${permissions[key].join('<br>')}</div>`).join(''),
				hashMini(permissions)
			)
		}</div>

		<div class="help" title="MediaCapabilities.decodingInfo()">codecs (${''+codecKeys.length}): ${
		!mediaCapabilities || !codecKeys.length ? note.unsupported :
			modal(
				`creep-worker-media-codecs`,
				Object.keys(mediaCapabilities).map(key => `${key}: ${mediaCapabilities[key].join(', ')}`).join('<br>'),
				hashMini(mediaCapabilities)
			)
		}</div>

		<div class="help" title="OffscreenCanvas.convertToBlob()\nFileReader.readAsDataURL()">canvas 2d:${
			canvas2d && canvas2d.dataURI ?
			`<span class="sub-hash">${hashMini(canvas2d.dataURI)}</span>` :
			` ${note.unsupported}`
		}</div>

		<div class="help" title="FontFace.load()">fonts (${fontFaceLoadFonts ? count(fontFaceLoadFonts) : '0'}/${'' + fontListLen}): ${
			!(fontFaceLoadFonts||[]).length ? note.unsupported : modal(
				'creep-worker-fonts',
				fontFaceLoadFonts.map(font => `<span style="font-family:'${font}'">${font}</span>`).join('<br>'),
				fontFaceLoadHash
			)
		}</div>

		<div class="block-text-large help relative" title="${blockHelpTitle}">
			<div>
				${fontPlatformVersion ? `platform: ${fontPlatformVersion}` : ((fonts) => {
					const icon = {
						'Linux': '<span class="icon linux"></span>',
						'Apple': '<span class="icon apple"></span>',
						'Windows': '<span class="icon windows"></span>',
						'Android': '<span class="icon android"></span>',
						'CrOS': '<span class="icon cros"></span>'
					}
					return !(fonts || []).length ? '' : (
						((''+fonts).match(/Lucida Console/)||[]).length ? `${icon.Windows}Lucida Console...` :
						((''+fonts).match(/Droid Sans Mono|Noto Color Emoji|Roboto/g)||[]).length == 3 ? `${icon.Linux}${icon.Android}Droid Sans Mono,Noto Color...` :
						((''+fonts).match(/Droid Sans Mono|Roboto/g)||[]).length == 2 ? `${icon.Android}Droid Sans Mono,Roboto...` :
						((''+fonts).match(/Noto Color Emoji|Roboto/g)||[]).length == 2 ? `${icon.CrOS}Noto Color Emoji,Roboto...` :
						((''+fonts).match(/Noto Color Emoji/)||[]).length ? `${icon.Linux}Noto Color Emoji...` :
						((''+fonts).match(/Arimo/)||[]).length ? `${icon.Linux}Arimo...` :
						((''+fonts).match(/Helvetica Neue/g)||[]).length == 2 ? `${icon.Apple}Helvetica Neue...` :
						`${(fonts||[])[0]}...`
					)
				})(fontFaceLoadFonts)}
				${(fontApps || []).length ? `<br>apps: ${(fontApps || []).join(', ')}` : ''}
				
				<span class="confidence-note">${
					!emojiFonts ? '' : emojiFonts.length > 1 ? `${emojiFonts[0]}...` : (emojiFonts[0] || '')
				}</span>
				<br><span>${textMetricsSystemSum || note.unsupported}</span>
				<br><span class="grey jumbo" style="${!(emojiFonts || [])[0] ? '' : `font-family: '${emojiFonts[0]}' !important`}">${formatEmojiSet(emojiSet)}</span>
			</div>
		</div>

		<div class="relative">${
			confidence ? `<span class="confidence-note">confidence: <span class="scale-up grade-${confidenceGrade}">${confidence}</span></span>` : ''
		}gpu:</div>
		<div class="block-text help" title="${
			confidence ? `\nWebGLRenderingContext.getParameter()\ngpu compressed: ${compressedGPU}\nknown parts: ${parts || 'none'}\ngibberish: ${gibbers || 'none'}\nwarnings: ${warnings.join(', ') || 'none'}` : 'WebGLRenderingContext.getParameter()'
		}">
			${webglVendor ? webglVendor : ''}
			${webglRenderer ? `<br>${webglRenderer}` : note.unsupported}
		</div>
	</div>
	<div class="col-six${lied ? ' rejected' : ''}">
		
		<div class="help" title="WorkerNavigator.language\nWorkerNavigator.languages\nIntl.Collator.resolvedOptions()\nIntl.DateTimeFormat.resolvedOptions()\nIntl.DisplayNames.resolvedOptions()\nIntl.ListFormat.resolvedOptions()\nIntl.NumberFormat.resolvedOptions()\nIntl.PluralRules.resolvedOptions()\nIntl.RelativeTimeFormat.resolvedOptions()\nNumber.toLocaleString()">lang:
			${
				localeEntropyIsTrusty ? `${language} (${systemCurrencyLocale})` : 
					`${language} (<span class="bold-fail">${engineCurrencyLocale}</span>)`
			}
			${
				locale === language ? '' : localeIntlEntropyIsTrusty ? ` ${locale}` : 
					` <span class="bold-fail">${locale}</span>`
			}
		</div>

		<div class="help" title="Intl.DateTimeFormat().resolvedOptions().timeZone\nDate.getDate()\nDate.getMonth()\nDate.parse()">timezone: ${timezoneLocation} (${''+timezoneOffset})</div>

		<div>device:</div>
		<div class="block-text help" title="WorkerNavigator.deviceMemory\nWorkerNavigator.hardwareConcurrency\nWorkerNavigator.platform\nWorkerNavigator.userAgent">
			${`${system}${platform ? ` (${platform})` : ''}`}
			${device ? `<br>${device}` : note.blocked}
			${
				hardwareConcurrency && deviceMemory ? `<br>cores: ${hardwareConcurrency}, ram: ${deviceMemory}` :
				hardwareConcurrency && !deviceMemory ? `<br>cores: ${hardwareConcurrency}` :
				!hardwareConcurrency && deviceMemory ? `<br>ram: ${deviceMemory}` : ''
			}
		</div>
		<div class="relative">userAgent:${!uaPostReduction ? '' : `<span class="confidence-note">ua reduction</span>`}</div>
		<div class="block-text help" title="WorkerNavigator.userAgent">
			<div>${userAgent || note.unsupported}</div>
		</div>
		<div>userAgentData:</div>
		<div class="block-text help" title="WorkerNavigator.userAgentData\nNavigatorUAData.getHighEntropyValues()">
			<div>
			${((userAgentData) => {
				const {
					architecture,
					bitness,
					brandsVersion,
					uaFullVersion,
					mobile,
					model,
					platformVersion,
					platform
				} = userAgentData || {}

				const windowsRelease = computeWindowsRelease({ platform, platformVersion })

				return !userAgentData ? note.unsupported : `
					${(brandsVersion || []).join(',')}${uaFullVersion ? ` (${uaFullVersion})` : ''}
					<br>${windowsRelease || `${platform} ${platformVersion}`} ${architecture ? `${architecture}${bitness ? `_${bitness}` : ''}` : ''}
					${model ? `<br>${model}` : ''}
					${mobile ? '<br>mobile' : ''}
				`
			})(userAgentData)}	
			</div>
		</div>
	</div>
	`
}