import React, { useState, useEffect } from 'react';
import supabase from './connect'; // Make sure this path is correct
import '../style/CreateReview.css'; // Import the CSS file

const CreateReview = ({userData}) => {
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  console.log("CreateReview received userData:", userData);
  const user_id = userData?.user_id || userData?.id || (userData && Object.keys(userData).length > 0 ? userData[Object.keys(userData)[0]] : null);
  console.log("Using user_id:", user_id);

  useEffect(() => {
    if (!user_id && process.env.NODE_ENV === 'development') {
      console.warn('User data or user_id is missing in CreateReview component. Check how userData is passed.');
      console.warn('Available userData:', userData);
    }
  }, [user_id, userData]);

  const regions = ['North', 'South', 'Central', 'West', 'East'];
  const MAX_FILE_SIZE_MB = 5;
  const MAX_TOTAL_FILES = 5;
  const MAX_TOTAL_SIZE_MB = 20;

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const handleImageChange = (e) => {
    setErrorMsg('');
    setSuccessMsg('');

    const files = e.target.files ? Array.from(e.target.files) : [];
    console.log(`Selected ${files.length} files:`, files);

    if (!files.length) {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviewUrls([]);
      return;
    }

    if (files.length > MAX_TOTAL_FILES) {
        setErrorMsg(`You can upload a maximum of ${MAX_TOTAL_FILES} images.`);
        e.target.value = null;
        return;
    }

    const newImageFiles = [];
    const newPreviewUrls = [];
    let validationError = false;
    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`Image "${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        validationError = true;
        break;
      }
      newImageFiles.push(file);
    }

    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Total size of all images exceeds ${MAX_TOTAL_SIZE_MB}MB limit.`);
      validationError = true;
    }

    if (validationError) {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviewUrls([]);
      e.target.value = null;
      return;
    }

    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    newImageFiles.forEach(file => newPreviewUrls.push(URL.createObjectURL(file)));

    console.log(`Created ${newPreviewUrls.length} preview URLs`);

    setImageFiles(newImageFiles);
    setImagePreviewUrls(newPreviewUrls);
  };

  const resetForm = () => {
    setTitle('');
    setReviewText('');
    setSelectedRegion(null);
    setImageFiles([]);
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
    const fileInput = document.getElementById('images');
    if (fileInput) fileInput.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress({});

    if (!user_id) {
      setErrorMsg('You must be logged in to post a review. Please log in and try again.');
      setUploading(false);
      return;
    }

    if (!title || !reviewText || !selectedRegion) {
      setErrorMsg('Please fill in Title, Review, and select a Region.');
      setUploading(false);
      return;
    }

    const cleanRegion = selectedRegion?.replace(/[0-9]/g, '');
    const uploadedImagePublicUrls = [];

    if (imageFiles.length > 0) {
      console.log(`Preparing to upload ${imageFiles.length} images`);

      const initialProgress = {};
      imageFiles.forEach((file, index) => {
        initialProgress[index] = 0;
      });
      setUploadProgress(initialProgress);

      const uploadPromises = imageFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${index}.${fileExt}`;
        const filePath = fileName;

        console.log(`Starting upload for file ${index}: ${file.name}`);

        try {
          const updateProgress = (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [index]: progress
            }));
          };
          
          updateProgress(10);

          const { error: uploadError } = await supabase.storage
            .from('image')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          updateProgress(80);

          if (uploadError) {
            console.error(`Image Upload Error for ${file.name}:`, uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('image')
            .getPublicUrl(filePath);

          updateProgress(100);

          if (!urlData || !urlData.publicUrl) {
            throw new Error(`Image ${file.name} uploaded, but could not get its URL.`);
          }
          
          console.log(`Successfully uploaded file ${index}: ${urlData.publicUrl}`);
          return urlData.publicUrl;
        } catch (err) {
          console.error('Unexpected upload error:', err);
          throw err;
        }
      });

      try {
        const urls = await Promise.all(uploadPromises);
        console.log(`All uploads complete. Got ${urls.length} URLs:`, urls);
        uploadedImagePublicUrls.push(...urls);
      } catch (error) {
        setErrorMsg(error.message + ' Review not posted.');
        setUploading(false);
        return;
      }
    }

    const reviewData = {
      user_id: user_id,
      post_title: title,
      post_detail: reviewText,
      post_region: cleanRegion,
      post_like: 0,
      post_dislike: 0,
    };

    if (uploadedImagePublicUrls.length > 0) {
      reviewData.post_image = uploadedImagePublicUrls;
      console.log("Image URLs to be saved:", uploadedImagePublicUrls);
    }

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('post')
        .insert([reviewData])
        .select();

      setUploading(false);

      if (insertError) {
        console.error('Insert Error:', insertError);
        if (insertError.code === '23505') {
          setErrorMsg('This post appears to be a duplicate. Please try with a different title or content.');
          if (insertError.details) {
            console.log('Constraint violation details:', insertError.details);
            if (insertError.details.includes('post_title')) {
              setErrorMsg('A post with this title already exists. Please use a different title.');
            } else if (insertError.details.includes('post_detail')) {
              setErrorMsg('A post with identical content already exists. Please modify your review text.');
            } else {
              setErrorMsg('Your post is similar to an existing one. Please make more substantial changes.');
            }
          }
        } else {
          setErrorMsg(`Failed to post review: ${insertError.message}. Check console.`);
        }
      } else {
        console.log('Inserted Review:', insertData);
        setSuccessMsg('Review posted successfully!');
        resetForm();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMsg(`An unexpected error occurred: ${error.message}`);
      setUploading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setErrorMsg('');
    setSuccessMsg('');
    console.log('Form cancelled');
  };

  return (
    <div className="container">
      <div className="formCard">
        <h2 className="heading">Create New Review</h2>

        {!user_id && (
          <p className="errorText">You must be logged in to create a review.</p>
        )}
        {errorMsg && <p className="errorText">{errorMsg}</p>}
        {successMsg && <p className="successText">{successMsg}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              type="text"
              id="title"
              className="input"
              placeholder="E.g. Amazing Italian Restaurant in Downtown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Region</label>
            <div className="regionContainer">
              {regions.map((region, index) => (
                <button
                  key={index}
                  type="button"
                  className={`regionButton ${selectedRegion === region + index ? 'selectedRegionButton' : ''}`}
                  onClick={() => {
                    setSelectedRegion(region + index);
                    setErrorMsg('');
                  }}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review" className="label">Review</label>
            <textarea
              id="review"
              className="textarea"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="images" className="label">
              Upload Images (Optional, max {MAX_FILE_SIZE_MB}MB each, {MAX_TOTAL_FILES} files max)
            </label>
            <input
              type="file"
              id="images"
              accept="image/png, image/jpeg, image/gif"
              multiple
              onChange={handleImageChange}
              className="input"
              disabled={uploading}
            />
            
            {imagePreviewUrls.length > 0 && (
              <div 
                className="imagePreviewContainer"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginTop: '10px'
                }}
              >
                {imagePreviewUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="imagePreviewWrapper"
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '100px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="imagePreview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {uploading && uploadProgress[index] !== undefined && (
                      <div className="uploadProgressOverlay">
                        <div 
                          className="uploadProgressBar" 
                          style={{width: `${uploadProgress[index]}%`}}
                        ></div>
                        <span className="uploadProgressText">
                          {uploadProgress[index]}%
                        </span>
                      </div>
                    )}
                    {!uploading && (
                      <button
                        type="button"
                        className="removeImageButton"
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                        onClick={() => {
                          const newFiles = [...imageFiles];
                          const newUrls = [...imagePreviewUrls];
                          URL.revokeObjectURL(newUrls[index]);
                          newFiles.splice(index, 1);
                          newUrls.splice(index, 1);
                          setImageFiles(newFiles);
                          setImagePreviewUrls(newUrls);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="buttonContainer">
            <button
              type="button"
              className="cancelButton"
              onClick={handleCancel}
              disabled={uploading || !user_id}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="postButton"
              disabled={uploading || !user_id}
            >
              {uploading ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReview;