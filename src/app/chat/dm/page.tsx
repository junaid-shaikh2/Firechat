// this is a file in the chat application project, to deal
// with one-on-one direct messaging between users.

import { useState, useEffect } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

import React from "react";

const page = () => {
  return (
    <div>
      <>Hello</>
    </div>
  );
};

export default page;
