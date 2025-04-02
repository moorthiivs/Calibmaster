const path = require('path');
const imageDataURI = require('image-data-uri');
/**
 * @param {Array} procedureimages 
 * @returns {Promise<Array>} 
 */
async function imageToBuffer(imagePath) {
    try {
        return await imageDataURI.encodeFromFile(imagePath);
    } catch (error) {
        console.error('Image conversion error:', error);
        return false;
    }
}

async function generateImageContent(procedureimages) {
    const content = [];
    
    if (!procedureimages || !Array.isArray(procedureimages)) {
        return content;
    }

    try {
        const imageBuffers = await Promise.all(
            procedureimages
                .filter(image => typeof image === 'string') // Filter out non-string values
                .map(async (image) => {
                    try {
                        const imagePath = path.resolve(__dirname, `../public/procedure_images/${image.trim()}`);
                        return await imageToBuffer(imagePath);
                    } catch (error) {
                        console.error(`Error loading image ${image}:`, error);
                        return false;
                    }
                })
        );

        const validImageBuffers = imageBuffers.filter(buffer => buffer !== false);

        if (validImageBuffers.length > 0) {
            // Smaller image sizes
            const singleImageSize = [90, 90];
            const multiImageSize = [70, 70];  
            
            content.push({
                stack: [
                    {
                        text: 'PROCEDURE DIAGRAM',
                        alignment: 'center',
                        bold: true,
                        fontSize: 9, // Smaller font size
                        margin: [0, 0, 0, 3] // Tighter margin
                    },
                    validImageBuffers.length === 1 ? {
                        alignment: 'center',
                        image: validImageBuffers[0],
                        fit: singleImageSize,
                        margin: [0, 0, 0, 10] // Reduced margin
                    } : {
                        columns: validImageBuffers.map((imageData) => ({
                            image: imageData,
                            fit: multiImageSize,
                            alignment: 'center'
                        })),
                        columnGap: 10, // Smaller gap between images
                        alignment: 'center',
                        margin: [0, 0, 0, 10] // Reduced margin
                    }
                ],
                alignment: 'center',
                margin: [0, 10, 0, 10] // Tighter vertical margins
            });
        }
    } catch (error) {
        console.error('Error generating image content:', error);
    }

    return content;
}

module.exports = { generateImageContent };