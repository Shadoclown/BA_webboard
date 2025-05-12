import React, { useState, useEffect } from 'react';
import supabase from './connect'; // Make sure this path is correct

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
        const filePath = `public/${fileName}`; // Path in bucket

        const { error: uploadError } = await supabase.storage
          .from('image') // YOUR_BUCKET_NAME
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Important: false to avoid overwriting if a hash collision somehow occurs
          });

        if (uploadError) {
          console.error(`Image Upload Error for ${file.name}:`, uploadError);
          // Throw an error to be caught by Promise.all
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('image') // YOUR_BUCKET_NAME
          .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
          console.error(`Error getting public URL for ${file.name}`);
          throw new Error(`Image ${file.name} uploaded, but could not get its URL.`);
        }
        return urlData.publicUrl;
      });

      try {
        const urls = await Promise.all(uploadPromises);
        uploadedImagePublicUrls.push(...urls);
      } catch (error) {
        // Error from one of the promises in Promise.all
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
      comment_count: 0, // Initialize comment count to 0
      post_like: 0,    // Initialize likes to 0
      post_dislike: 0, // Initialize dislikes to 0
      // user_id: supabase.auth.user()?.id, // Example
    };

    if (uploadedImagePublicUrls.length > 0) {
      // IMPORTANT: Ensure 'post' table has a column like 'post_image_urls' (TEXT[] type)
      reviewData.post_image = uploadedImagePublicUrls;
    }

    // 3. Insert review into the database
    const { data: insertData, error: insertError } = await supabase
      .from('post') // YOUR_TABLE_NAME for reviews
      .insert([reviewData])
      .select();

    setUploading(false);

    if (insertError) {
      console.error('Insert Error:', insertError);
      setErrorMsg(`Failed to post review: ${insertError.message}. Check console. Possible issues: RLS, missing/mismatched columns (e.g., 'post_image_urls' not TEXT[]).`);
    } else {
      console.log('Inserted Review:', insertData);
      setSuccessMsg('Review posted successfully!');
      resetForm();
    }
  };

  const handleCancel = () => {
    resetForm();
    setErrorMsg('');
    setSuccessMsg('');
    console.log('Form cancelled');
  };

  const styles = {
    container: { /* ... */ },
    formCard: { /* ... */ },
    heading: { /* ... */ },
    label: { /* ... */ },
    input: { /* ... */ },
    textarea: { /* ... */ },
    regionContainer: { /* ... */ },
    regionButton: { /* ... */ },
    selectedRegionButton: { /* ... */ },
    buttonContainer: { /* ... */ },
    cancelButton: { /* ... */ },
    postButton: { /* ... */ },
    imagePreviewContainer: { // Style for the container of multiple previews
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '10px',
      marginBottom: '20px',
    },
    imagePreview: {
      width: '100px', // Fixed width for multiple previews
      height: '100px',// Fixed height
      border: '1px solid #ddd',
      borderRadius: '4px',
      objectFit: 'cover',
    },
    errorText: { /* ... */ },
    successText: { /* ... */ },
    // Re-add styles if they were removed in the prompt for brevity
    // ... (your existing styles are good, keep them)
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Align to top for longer forms
        minHeight: 'calc(100vh - 100px)',
        padding: '40px 20px', // More padding
        backgroundColor: '#f0f2f5',
      },
      formCard: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '700px',
      },
      heading: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '30px',
        color: '#333',
        textAlign: 'center',
      },
      label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#555',
      },
      input: {
        width: '100%',
        padding: '12px',
        marginBottom: '25px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontSize: '14px',
      },
      textarea: {
        width: '100%',
        padding: '12px',
        marginBottom: '25px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontSize: '14px',
        minHeight: '120px',
        resize: 'vertical',
      },
      regionContainer: {
        display: 'flex',
        gap: '10px', // Slightly reduced gap
        marginBottom: '25px',
        flexWrap: 'wrap',
      },
      regionButton: {
        padding: '10px 15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#555',
        flex: '1 1 auto', // Allow buttons to grow and shrink
        textAlign: 'center',
      },
      selectedRegionButton: {
        backgroundColor: '#e0e0e0',
        borderColor: '#ccc',
        fontWeight: 'bold',
        color: '#333',
      },
      buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '20px', // More space above buttons
      },
      cancelButton: {
        padding: '12px 25px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#333',
        fontWeight: '500',
      },
      postButton: {
        padding: '12px 25px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#f2c957', // Your theme color
        color: '#675D50', // Your theme text color
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
      },
      errorText: {
          color: 'red',
          marginBottom: '15px',
          fontSize: '14px',
          textAlign: 'center',
      },
      successText: {
          color: 'green',
          marginBottom: '15px',
          fontSize: '14px',
          textAlign: 'center',
      }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.heading}>Create New Review</h2>

        {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
        {successMsg && <p style={styles.successText}>{successMsg}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" style={styles.label}>Title</label>
            <input
              type="text"
              id="title"
              style={styles.input}
              placeholder="E.g. Amazing Italian Restaurant in Downtown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={styles.label}>Region</label>
            <div style={styles.regionContainer}>
              {regions.map((region, index) => (
                <button
                  key={index}
                  type="button"
                  style={{
                    ...styles.regionButton,
                    ...(selectedRegion === region + index && styles.selectedRegionButton),
                  }}
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
            <label htmlFor="review" style={styles.label}>Review</label>
            <textarea
              id="review"
              style={styles.textarea}
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="images" style={styles.label}>
              Upload Images (Optional, max {MAX_FILE_SIZE_MB}MB each, {MAX_TOTAL_FILES} files max)
            </label>
            <input
              type="file"
              id="images" // Changed id for clarity
              accept="image/png, image/jpeg, image/gif"
              multiple // Added multiple attribute
              onChange={handleImageChange}
              style={styles.input}
              disabled={uploading}
            />
            {imagePreviewUrls.length > 0 && (
              <div style={styles.imagePreviewContainer}>
                {imagePreviewUrls.map((url, index) => (
                  <img
                    key={index} // Using index as key; for more stability, use a unique ID if files have one
                    src={url}
                    alt={`Preview ${index + 1}`}
                    style={styles.imagePreview}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={styles.buttonContainer}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.postButton}
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