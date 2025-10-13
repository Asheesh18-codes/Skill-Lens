import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Test PDF parsing
async function testPdfParsing() {
    try {
        const pdfPath = 'C:/Users/Hp/Downloads/Resume_Ashish.pdf';
        
        // Check if file exists
        if (!fs.existsSync(pdfPath)) {
            console.log('PDF file does not exist at:', pdfPath);
            return;
        }
        
        console.log('PDF file found. Size:', fs.statSync(pdfPath).size, 'bytes');
        console.log('pdfParse type:', typeof pdfParse);
        console.log('pdfParse:', pdfParse);
        
        // Read the PDF buffer
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log('Buffer read successfully. Length:', dataBuffer.length);
        
        // Parse PDF - try different ways
        let data;
        if (typeof pdfParse === 'function') {
            data = await pdfParse(dataBuffer);
        } else if (pdfParse.default && typeof pdfParse.default === 'function') {
            data = await pdfParse.default(dataBuffer);
        } else if (pdfParse.parse && typeof pdfParse.parse === 'function') {
            data = await pdfParse.parse(dataBuffer);
        } else {
            console.log('Available methods:', Object.keys(pdfParse));
            throw new Error('Cannot find pdf parsing function');
        }
        
        console.log('PDF parsed successfully!');
        console.log('Text length:', data.text.length);
        console.log('First 200 characters:', data.text.substring(0, 200));
        
    } catch (error) {
        console.error('PDF parsing failed:', error.message);
        console.error('Error details:', error);
    }
}

testPdfParsing();