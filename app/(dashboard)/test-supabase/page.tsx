import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const supabase = await createClient()
  
  console.log('🔍 Testing Supabase connection...')
  
  // Test fetch composants
  const { data: composants, error: composantsError } = await supabase
    .from('composants')
    .select('*')
  
  console.log('📦 Composants data:', composants)
  console.log('❌ Composants error:', composantsError)
  
  // Test fetch catégories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories_composants')
    .select('*')
    .order('name')
  
  console.log('📁 Categories data:', categories)
  console.log('❌ Categories error:', categoriesError)
  
  return (
    <div className="container mx-auto p-8 bg-white">
      <h1 className="text-2xl font-bold mb-8">🧪 Test Connexion Supabase</h1>
      
      <div className="space-y-6">
        {/* Variables Env */}
        <div className="p-6 border-2 rounded-lg">
          <h2 className="font-bold text-lg mb-3">🔑 Variables d'Environnement</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
              <br />
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NON DÉFINIE'}
              </span>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
              <br />
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? '✅ Définie (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30) + '...)'
                  : '❌ NON DÉFINIE'
                }
              </span>
            </div>
          </div>
        </div>
        
        {/* Composants */}
        <div className="p-6 border-2 rounded-lg">
          <h2 className="font-bold text-lg mb-3">📦 Table: composants</h2>
          
          {composantsError ? (
            <div className="bg-red-100 border-2 border-red-500 p-4 rounded">
              <p className="font-bold text-red-700">❌ ERREUR</p>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(composantsError, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-green-100 border-2 border-green-500 p-4 rounded">
              <p className="font-bold text-green-700">✅ SUCCÈS</p>
              <p className="text-lg mt-2">{composants?.length || 0} composants trouvés</p>
              <pre className="text-xs mt-4 overflow-auto max-h-96 bg-white p-3 rounded">
                {JSON.stringify(composants, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {/* Catégories */}
        <div className="p-6 border-2 rounded-lg">
          <h2 className="font-bold text-lg mb-3">📁 Table: categories_composants</h2>
          
          {categoriesError ? (
            <div className="bg-red-100 border-2 border-red-500 p-4 rounded">
              <p className="font-bold text-red-700">❌ ERREUR</p>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(categoriesError, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-green-100 border-2 border-green-500 p-4 rounded">
              <p className="font-bold text-green-700">✅ SUCCÈS</p>
              <p className="text-lg mt-2">{categories?.length || 0} catégories trouvées</p>
              <pre className="text-xs mt-4 overflow-auto max-h-96 bg-white p-3 rounded">
                {JSON.stringify(categories, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

