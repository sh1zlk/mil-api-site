// src/services/certificateService.js
import apiClient from './apiClient';

const certificateService = {
    // Обробка завантаженого сертифіката та отримання даних
    processCertificate: async (file) => {
        const formData = new FormData();
        formData.append('certificate', file);

        try {
            const response = await apiClient.post('/api/v1/certificates/process', formData);
            return response.data;
        } catch (error) {
            console.error('Certificate processing error:', error);
            throw error;
        }
    },

    // Створення користувача на основі даних сертифіката
    createUserFromCertificate: async (certificateData) => {
        try {
            const response = await apiClient.post('/api/v1/users/from-certificate', {
                username: certificateData.username,
                username_alias: certificateData.username_alias,
                pki_certificate_cn: certificateData.pki_certificate_cn,
                pki_certificate_serial: certificateData.pki_certificate_serial,
                pki_certificate_fingerprint: certificateData.pki_certificate_fingerprint,
                post_id: certificateData.post_id || null
            });

            return response.data;
        } catch (error) {
            console.error('User creation from certificate error:', error);
            throw error;
        }
    },

    // Перевірка сертифіката на валідність
    validateCertificate: async (certificateData) => {
        try {
            const response = await apiClient.post('/api/v1/certificates/validate', {
                certificate_cn: certificateData.certificate_cn,
                certificate_serial: certificateData.certificate_serial,
                certificate_fingerprint: certificateData.certificate_fingerprint
            });

            return response.data;
        } catch (error) {
            console.error('Certificate validation error:', error);
            throw error;
        }
    },

    // Симуляція обробки сертифіката (для розробки)
    processCertificateMock: async (file) => {
        // Симуляція затримки обробки
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Симуляція даних, які ми отримуємо з сертифіката
        const mockCertData = {
            ssl_verify: 'SUCCESS',
            ssl_dn: `CN=${file.name.replace(/\.[^/.]+$/, '')}`,
            ssl_cn: file.name.replace(/\.[^/.]+$/, ''),
            ssl_fingerprint: '50cc615219b5e4b9adb647ac16509ad7ae5cea82',
            ssl_serial: '7149D5B4BB186BDD281C33B64D8E85852A6374AD',
            ssl_issuer: 'CN=TestCert,O=Internet Widgits Pty Ltd,L=Kiyv,ST=Kiyv,C=UA'
        };

        return mockCertData;
    }
};

export default certificateService;