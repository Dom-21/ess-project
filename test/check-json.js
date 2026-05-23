async function check() {
    try {
        const res = await fetch('http://127.0.0.1:9222/json/new?url=http://localhost:4300', {
            method: 'PUT'
        });
        console.log('STATUS:', res.status);
        const text = await res.text();
        console.log('TEXT:', text);
    } catch (e) {
        console.log('ERROR:', e.message);
    }
}
check();
