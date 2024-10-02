import officeParser from 'officeparser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import { config } from 'dotenv';

config({ path: './key.env' });

// Initialize the Google Generative AI model
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API key is missing. Please check your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

async function fun() {
    const pdfPath = "./ShitenduResume.pdf";

    // Check if the PDF file exists
    if (!fs.existsSync(pdfPath)) {
        console.error(`The file ${pdfPath} does not exist.`);
        return;
    }

    let promise = new Promise((resolve, reject) => {
        officeParser.parseOffice(pdfPath, function (data, err) {
            if (err) {
                reject("Error in reading the file: " + err);
            } else if (data) {
                resolve(data);
            } else {
                reject("No data found in the file.");
            }
        });
    });

    try {
        let result = await promise;
        const prompt = `
        // Here is a resume data extracted from a document:
        ${JSON.stringify(result)}

        Please categorize this information into the following resume sections:
        1. Personal Details (Mobile Number, Email, LinkedIn)      

        Make sure to properly format the categories based on the above parameters only and organize the data accordingly.
        Present each category clearly without using '/n' instead use new lines.
        return data in this format of json
        {
  "Resume Data": {
    "Personal Details": {
      "Mobile Number": "+91-8765005126",
      "Email": "vaibhav3746@gmail.com",
      "LinkedIn": "LinkedIn",
      "GitHub": "GitHub"
    },
    "Technical Skills": {
      "Programming Languages": ["C++", "HTML", "CSS"],
      "Frontend": ["JavaScript", "ReactJs", "HTML", "CSS", "Bootstrap"],
      "Backend": ["MySQL", "Nodejs"],
      "Familiarity": ["Git", "GitHub", "prompting", "OpenAI", "Visual Studio Code"]
    },
    "Experience": [
      {
        "Title": "Web Development",
        "Duration": "June 2024 – July 2024",
        "Company": "The Spark Foundation",
        "Description": [
          "Engineered a responsive Basic Banking System within a 4-week internship; utilized MySQL for backend database management, leading to improved data retrieval times, demonstrating a commitment to enhancing overall user experience.",
          "Secured 95% for project accuracy by rigorously testing 50+ transactions for reliability and consistency."
        ]
      },
        `;

        const api_result = await model.generateContent(prompt);
        console.log("Model response:", api_result.response.text());
       
       
        const responseData = api_result.response.text()
        .replace(/#/g, '') // Remove '#'
        .replace(/\*/g, '') // Remove '*'
        .replace(/(\r\n|\n|\r)/g, '\n') // Normalize all new lines to '\n'
        
        
        // Write the JSON data to a file
        // fs.writeFileSync('resume_categorization_response.json', JSON.stringify(responseData, null, 2), 'utf8');
        fs.writeFileSync('resume_categorization_response.json', responseData, 'utf8');
        
        console.log("Response saved to resume_categorization_response.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

fun();


