async function testApi() {
    const url = 'https://smart-pesantren.vercel.app/api/notifications/send';
    const payload = {
        studentId: '6947ed0e-927b-4df4-b3b4-53909774646a', // From earlier logs
        title: 'TEST DARI API SCRIPT',
        message: 'Ini adalah pesan tes untuk memastikan API bekerja dengan kolom message yang baru.',
        type: 'absensi'
    };

    console.log('Testing API with payload:', payload);
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log('API RESPONSE STATUS:', res.status);
        console.log('API RESPONSE DATA:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('FETCH ERROR:', err);
    }
}

testApi();
