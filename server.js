import axios from 'axios';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const baseUrl = 'https://indian-railway-irctc.p.rapidapi.com/api/trains-search/v1/train';

// GET route - render the search interface
app.get('/', (req, res) => {
  res.render('interface.ejs', { trainData: null, error: null });
});

// POST route - handle form submission and display results
app.post('/submit', async (req, res) => {
  try {
    const number = req.body.number;

    // Validate train number
    if (!number || !/^\d{5}$/.test(number)) {
      return res.render('output', {
        trainData: null,
        error: 'Train number must be 5 digits'
      });
    }

    console.log(`Searching for train: ${number}`);

    // Make API request
    const result = await axios.get(`${baseUrl}/${number}`, {
      params: {
        isH5: 'true',
        client: 'web'
      },
      headers: {
        'X-RapidAPI-Key': '6c485a49dcmshb4165eb9c618de2p12f6e7jsnafaf0b3a0750',
        'X-RapidAPI-Host': 'indian-railway-irctc.p.rapidapi.com'
      }
    });

    // Log the raw response for debugging
    console.log('API Response Status:', result.status);
    console.log('API Response Data:', JSON.stringify(result.data, null, 2));

    // Check if we have data
    if (!result.data) {
      return res.render('output', {
        trainData: null,
        error: 'No data received from API'
      });
    }

    // Render the output page with the raw API data
    res.render('output', {
      trainData: result.data,
      error: null
    });

  } catch (error) {
    console.error('API Error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);

    // Handle different types of errors
    let errorMessage = 'Something went wrong. Please try again.';

    if (error.response?.status === 404) {
      errorMessage = 'Train not found. Please check the train number.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage = 'API access denied. Please check the API key.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to the train service. Please try again later.';
    }

    res.render('output', {
      trainData: null,
      error: errorMessage
    });
  }
});

// Optional: Direct route to search by train number in URL
app.get('/train/:number', async (req, res) => {
  const number = req.params.number;

  try {
    if (!number || !/^\d{5}$/.test(number)) {
      return res.render('output', {
        trainData: null,
        error: 'Invalid train number in URL'
      });
    }

    const result = await axios.get(`${baseUrl}/${number}`, {
      params: {
        isH5: 'true',
        client: 'web'
      },
      headers: {
        'X-RapidAPI-Key': '6c485a49dcmshb4165eb9c618de2p12f6e7jsnafaf0b3a0750',
        'X-RapidAPI-Host': 'indian-railway-irctc.p.rapidapi.com'
      }
    });

    res.render('output', {
      trainData: result.data,
      error: null
    });

  } catch (error) {
    console.error('Direct route error:', error.message);
    res.render('output', {
      trainData: null,
      error: 'Failed to fetch train data'
    });
  }
});

app.listen(port, () => {
  console.log(`🚂 Train Info Server running on http://localhost:${port}`);
  console.log(`📝 Make sure you have these files:`);
  console.log(`   📁 views/interface.ejs (your search form)`);
  console.log(`   📁 views/output.ejs (the template above)`);
});