const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

globalThis.fetch = async (url) => {
  await sleep(100); // simulate network delay
  if (url === 'config.example.json') {
    return { ok: true, json: async () => { await sleep(10); return { base: true }; } };
  } else if (url === 'config.local.json') {
    return { ok: true, json: async () => { await sleep(10); return { local: true }; } };
  }
  return { ok: false };
};

async function testSequential() {
  const start = performance.now();
  try {
    const baseResponse = await fetch('config.example.json', { cache: 'no-store' });
    if (!baseResponse.ok) {
      throw new Error('Base config fetch failed');
    }
    let mergedConfig = await baseResponse.json();

    const useLocalOverride = true;
    if (useLocalOverride) {
      try {
        const localResponse = await fetch('config.local.json', { cache: 'no-store' });
        if (localResponse.ok) {
          const localConfig = await localResponse.json();
          if (localConfig && typeof localConfig === 'object' && !Array.isArray(localConfig)) {
            mergedConfig = {
              ...mergedConfig,
              ...localConfig,
            };
          }
        }
      } catch (localErr) {
        console.warn('Optional local config load failed:', localErr);
      }
    }
  } catch (err) {}
  return performance.now() - start;
}

async function testParallel() {
  const start = performance.now();
  try {
    const useLocalOverride = true;
    const baseFetch = fetch('config.example.json', { cache: 'no-store' });
    const localFetch = useLocalOverride
      ? fetch('config.local.json', { cache: 'no-store' }).catch(err => {
          console.warn('Optional local config load failed:', err);
          return null;
        })
      : Promise.resolve(null);

    const [baseResponse, localResponse] = await Promise.all([baseFetch, localFetch]);

    if (!baseResponse.ok) {
      throw new Error('Base config fetch failed');
    }
    let mergedConfig = await baseResponse.json();

    if (localResponse && localResponse.ok) {
      try {
        const localConfig = await localResponse.json();
        if (localConfig && typeof localConfig === 'object' && !Array.isArray(localConfig)) {
          mergedConfig = {
            ...mergedConfig,
            ...localConfig,
          };
        }
      } catch (localErr) {
        console.warn('Optional local config load failed:', localErr);
      }
    }
  } catch (err) {}
  return performance.now() - start;
}

async function runBenchmark() {
  // warm up
  for(let i = 0; i < 3; i++) {
    await testSequential();
    await testParallel();
  }

  let seqTotal = 0;
  let parTotal = 0;
  const iters = 10;
  for(let i = 0; i < iters; i++) {
    seqTotal += await testSequential();
    parTotal += await testParallel();
  }

  console.log(`Sequential average: ${(seqTotal / iters).toFixed(2)}ms`);
  console.log(`Parallel average: ${(parTotal / iters).toFixed(2)}ms`);
}

runBenchmark();
