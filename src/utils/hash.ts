export async function sha256Hex(input: string): Promise<string> {
	if (typeof window !== 'undefined' && typeof window.crypto?.subtle !== 'undefined') {
		const enc = new TextEncoder();
		const data = enc.encode(input);
		const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

		try {
			const maybeRequire = (globalThis as any).require as ((name: string) => any) | undefined;
			if (typeof maybeRequire === 'function') {
				const nodeCrypto = maybeRequire('crypto');
				return nodeCrypto.createHash('sha256').update(input, 'utf8').digest('hex');
			}

			const nodeCrypto = (await (eval('import') as any)('crypto')) as any;
			return nodeCrypto.createHash('sha256').update(input, 'utf8').digest('hex');
		} catch (err) {
			throw new Error('No crypto available to compute SHA-256');
		}
}

export default sha256Hex;