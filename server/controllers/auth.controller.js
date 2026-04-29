const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    // Validate school domain (Only @sasa.hs.kr allowed)
    if (!email.endsWith('@sasa.hs.kr')) {
      return res.status(403).json({ message: 'Only @sasa.hs.kr domain is permitted to login.' });
    }

    // Find user or create if not exists
    let user = await User.findByEmail(email);
    if (!user) {
      const insertId = await User.create({ email, name, role: 'USER' });
      user = await User.findById(insertId);
    }

    // Create JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};
