// Test script to verify OpenAI integration
const OpenAI = require('openai');

async function testSetup() {
  console.log('🧪 Testing OpenAI setup...');
  
  // Check if API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ OpenAI API key found');
  console.log(`🔑 Key starts with: ${apiKey.substring(0, 10)}...`);
  
  // Test OpenAI connection
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('🤖 Testing OpenAI connection...');
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: ['Test embedding for setup verification'],
    });
    
    console.log('✅ OpenAI connection successful!');
    console.log(`📊 Embedding dimensions: ${response.data[0].embedding.length}`);
    console.log('🎯 AI matching system is ready to use!');
    
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
  }
}

testSetup().catch(console.error);