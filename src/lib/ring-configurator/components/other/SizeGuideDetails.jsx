// SizeGuideDetails.jsx
import React, { useContext } from 'react';
import { RingContext } from '../../contexts/RingContext'; // adjust path if needed

const sizeGuideData = {
  R1: {
    text: 'US - Mexico - Canada',
    image: '/size-guide/size-guide-R1.png',
  },
  R2: {
    text: 'UK - South Africa - New Zealand - Australia',
    image: '/size-guide/size-guide-R2.png',
  },
  R3: {
    text: 'France',
    image: '/size-guide/size-guide-R3.png',
  },
  R4: {
    text: 'Turkey - South America - Singapore - Japan - Israel - India - China',
    image: '/size-guide/size-guide-R4.png',
  },
  R5: {
    text: 'Ukraine - Russia - Germany - Asia',
    image: '/size-guide/size-guide-R5.png',
  },
  R6: {
    text: 'Switzerland - Spain - Netherlands - Italy',
    image: '/size-guide/size-guide-R6.png',
  },
  R7: {
    text: 'Hong Kong',
    image: '/size-guide/size-guide-R7.png',
  },
  R8: {
    text: 'Victoria',
    image: '/size-guide/size-guide-R8.png',
  },
};

const SizeGuideDetails = () => {
  const { sizeOption } = useContext(RingContext);
  const guide = sizeGuideData[sizeOption];

  return (
    <div className="bg-white pt-5 mb-2.5 space-y-4">
      <div>
        <p className="mb-2.5 font-sub-heading">
          {guide ? guide.text : 'No guide available for this selection'}
        </p>
      </div>
      <div>
        <img
          src={guide ? guide.image : '/size-guide/default.png'}
          alt={guide ? guide.text : 'Default guide'}
          className="w-full max-w-md object-contain"
        />
      </div>
    </div>
  );
};

export default SizeGuideDetails;
