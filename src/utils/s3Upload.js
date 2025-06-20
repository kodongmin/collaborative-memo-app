const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const { v4: uuidv4 } = require('uuid');

const uploadToS3 = async (file) => {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            }
        });

        await upload.done();
        
        // Generate a pre-signed URL that expires in 1 hour
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return {
            url: url,
            key: fileName
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

const getPreSignedUrl = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });
        
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw new Error('Failed to generate pre-signed URL');
    }
};

const deleteFromS3 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};

module.exports = { uploadToS3, deleteFromS3, getPreSignedUrl }; 