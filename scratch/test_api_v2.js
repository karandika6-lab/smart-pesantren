async function testApi() {
    const url = 'https://smart-pesantren.vercel.app/api/notifications/send';
    const payload = {
        studentId: '7e5afcfa-c542-43a0-8cf3-e5cf09bc3236',
        title: 'TEST DARI API SCRIPT V2',
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
