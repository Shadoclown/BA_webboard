import React, { useState, useEffect } from 'react';
import supabase from './connect'; // Make sure this path is correct
import '../style/CreateReview.css'; // Import the CSS file

const CreateReview = () => {
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // Changed to array
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // Changed to array
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const regions = ['North', 'South', 'Central', 'West', 'East'];
  const MAX_FILE_SIZE_MB = 5;
  const MAX_TOTAL_FILES = 5; // Optional: Limit total number of files

  useEffect(() => {
    // Clean up object URLs for image previews
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]); // Dependency on the array itself

  const handleImageChange = (e) => {
    setErrorMsg('');
    setSuccessMsg('');

    const files = e.target.files ? Array.from(e.target.files) : [];

    if (!files.length) {
      // Clear existing if no new files are chosen (e.g., user cancels file dialog)
      // Or, you might want to append if that's the desired UX.
      // For simplicity, let's replace.
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviewUrls([]);
      return;
    }

    // Optional: Limit total number of files
    if (files.length > MAX_TOTAL_FILES) {
        setErrorMsg(`You can upload a maximum of ${MAX_TOTAL_FILES} images.`);
        e.target.value = null; // Reset file input
        return;
    }

    const newImageFiles = [];
    const newPreviewUrls = [];
    let validationError = false;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`Image "${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        validationError = true;
        break; // Stop processing further files
      }
      newImageFiles.push(file);
    }

    if (validationError) {
      // Don't set any files if one is invalid
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url)); // Revoke any previous previews
      setImageFiles([]);
      setImagePreviewUrls([]);
      e.target.value = null; // Reset file input
      return;
    }

    // Revoke old URLs before creating new ones
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    // Create new preview URLs
    newImageFiles.forEach(file => newPreviewUrls.push(URL.createObjectURL(file)));

    setImageFiles(newImageFiles);
    setImagePreviewUrls(newPreviewUrls);
  };

  const resetForm = () => {
    setTitle('');
    setReviewText('');
    setSelectedRegion(null);
    setImageFiles([]);
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url)); // Clean up
    setImagePreviewUrls([]);
    // Reset file input visually
    const fileInput = document.getElementById('images'); // Note ID change if you change it
    if (fileInput) fileInput.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || !reviewText || !selectedRegion) {
      setErrorMsg('Please fill in Title, Review, and select a Region.');
      setUploading(false);
      return;
    }

    const cleanRegion = selectedRegion?.replace(/[0-9]/g, '');
    const uploadedImagePublicUrls = [];

    // 1. Upload images if selected
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        // Add more uniqueness to filename to avoid collisions if multiple users upload simultaneously
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        // Simplified path - avoid using 'public/' prefix
        const filePath = fileName;

        try {
          const { error: uploadError } = await supabase.storage
            .from('image')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error(`Image Upload Error for ${file.name}:`, uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('image')
            .getPublicUrl(filePath);

          if (!urlData || !urlData.publicUrl) {
            throw new Error(`Image ${file.name} uploaded, but could not get its URL.`);
          }
          return urlData.publicUrl;
        } catch (err) {
          console.error('Unexpected upload error:', err);
          throw err;
        }
      });

      try {
        const urls = await Promise.all(uploadPromises);
        uploadedImagePublicUrls.push(...urls);
      } catch (error) {
        setErrorMsg(error.message + ' Review not posted.');
        setUploading(false);
        return;
      }
    }

    // 2. Prepare review data
    const reviewData = {
      post_title: title,
      post_detail: reviewText,
      post_region: cleanRegion,
      post_like: 0,
      post_dislike: 0,
      // Don't include post_id field to avoid primary key conflicts
    };

    if (uploadedImagePublicUrls.length > 0) {
      reviewData.post_image = uploadedImagePublicUrls;
    }

    try {
      // 3. Insert review into the database
      const { data: insertData, error: insertError } = await supabase
        .from('post')
        .insert([reviewData])
        .select();

      setUploading(false);

      if (insertError) {
        console.error('Insert Error:', insertError);
        if (insertError.code === '23505') {
          // This is a PostgreSQL unique constraint violation code
          setErrorMsg('This post appears to be a duplicate. Please try with a different title or content.');
          
          // Better explanation of duplicate detection
          if (insertError.details) {
            console.log('Constraint violation details:', insertError.details);
            
            if (insertError.details.includes('post_title')) {
              setErrorMsg('A post with this title already exists. Please use a different title.');
            } else if (insertError.details.includes('post_detail')) {
              setErrorMsg('A post with identical content already exists. Please modify your review text.');
            } else {
              // General duplicate case when we can't determine the exact constraint
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
              <div className="imagePreviewContainer">
                {imagePreviewUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="imagePreview"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="buttonContainer">
            <button
              type="button"
              className="cancelButton"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="postButton"
              disabled={uploading}
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