"use client"

import { useState, useEffect } from 'react'

export default function SellerPage(){
  const [mode, setMode] = useState('login') // login | signup | dashboard
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [seller, setSeller] = useState(null)

  const [wasteType, setWasteType] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [imageData, setImageData] = useState(null)
  const [unit, setUnit] = useState('kg')
  const [loading, setLoading] = useState(false)
  const [myProducts, setMyProducts] = useState([])
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(()=>{
    if(seller) fetchMyProducts(seller.id)
  },[seller])

  async function signup(e){
    e?.preventDefault()
    const res = await fetch('http://127.0.0.1:5000/seller/signup', { method: 'POST', body: JSON.stringify({ name, email, password }), headers:{'Content-Type':'application/json'} })
    const data = await res.json()
    if(res.ok && data.user) { setSeller(data.user); setMode('dashboard'); setSuccessMsg('Signed up') }
    else alert(data.error || 'Signup failed')
  }

  async function login(e){
    e?.preventDefault()
    const res = await fetch('http://127.0.0.1:5000/seller/login', { method: 'POST', body: JSON.stringify({ email, password }), headers:{'Content-Type':'application/json'} })
    const data = await res.json()
    if(res.ok && data.user) { setSeller(data.user); setMode('dashboard'); setSuccessMsg('Logged in') }
    else alert(data.error || 'Login failed')
  }

  function handleFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = () => setImageData(reader.result)
    reader.readAsDataURL(f)
  }

  function formatPriceInput(val){
    // remove non digits except dot
    return val.replace(/[^[0-9].]/g,'')
  }

  async function addProduct(e){
    e?.preventDefault()
    if(!seller) return alert('Login first')
    if(!wasteType) return alert('Enter waste type')
    setLoading(true)
    const payload = {
      sellerId: seller.id,
      sellerName: seller.name,
      companyName: seller.name,
      wasteType,
      quantity,
      unit,
      price,
      location,
      description,
      imageData,
      createdAt: new Date().toISOString()
    }
    try{
      const res = await fetch('http://127.0.0.1:5000/seller/add_product', { method: 'POST', body: JSON.stringify(payload), headers:{'Content-Type':'application/json'} })
      const data = await res.json()
      if(res.ok && data.product){
        setSuccessMsg('Product added successfully')
        // clear form
        setWasteType('')
        setQuantity(1)
        setPrice('')
        setLocation('')
        setDescription('')
        setImageData(null)
        fetchMyProducts(seller.id)
      } else {
        alert(data.error || 'Add failed')
      }
    }catch(err){
      console.error(err)
      alert('Network error')
    }finally{
      setLoading(false)
      setTimeout(()=>setSuccessMsg(''),3000)
    }
  }

  async function fetchMyProducts(sid){
    if(!sid) return
    try{
      const r = await fetch(`http://127.0.0.1:5000/seller/products?sellerId=${sid}`)
      const d = await r.json()
      if(r.ok) setMyProducts(d)
    }catch(e){console.error(e)}
  }

  async function deleteProduct(id){
    if(!confirm('Delete product?')) return
    const r = await fetch('http://127.0.0.1:5000/seller/delete_product', { method: 'POST', body: JSON.stringify({ id }), headers:{'Content-Type':'application/json'} })
    const d = await r.json()
    if(r.ok) {
      setSuccessMsg('Deleted')
      fetchMyProducts(seller.id)
      setTimeout(()=>setSuccessMsg(''),2000)
    } else alert(d.error || 'Delete failed')
  }

  if(mode === 'login' || mode === 'signup'){
    return (
      <div className="max-w-lg mx-auto p-8">
        <h2 className="text-2xl font-extrabold mb-4">{mode==='login'?'Seller Login':'Create Seller Account'}</h2>
        {mode==='signup' && <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 border rounded mb-3" />}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 border rounded mb-3" />
        <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full p-3 border rounded mb-3" />
        <div className="flex gap-2">
          {mode==='login' ? <button onClick={login} className="px-4 py-2 bg-emerald-600 text-white rounded">Login</button> : <button onClick={signup} className="px-4 py-2 bg-emerald-600 text-white rounded">Signup</button>}
          <button onClick={()=>setMode(mode==='login'?'signup':'login')} className="px-4 py-2 border rounded">Switch</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-sm text-gray-600">Signed in as <strong>{seller?.email}</strong></p>

          <form onSubmit={addProduct} className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">List a Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Waste Type</label>
                <input value={wasteType} onChange={e=>setWasteType(e.target.value)} placeholder="e.g. Scrap Metal" className="w-full p-3 border rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <div className="mt-1 flex items-center gap-2">
                  <button type="button" onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="px-3 py-1 border rounded">-</button>
                  <input value={quantity} onChange={e=>setQuantity(Math.max(1,Number(e.target.value||0)))} className="w-20 p-2 border rounded text-center" />
                  <button type="button" onClick={()=>setQuantity(q=>q+1)} className="px-3 py-1 border rounded">+</button>
                  <select value={unit} onChange={e=>setUnit(e.target.value)} className="ml-3 p-2 border rounded">
                    <option value="kg">kg</option>
                    <option value="tonne">tonne</option>
                    <option value="pcs">pcs</option>
                    <option value="litre">litre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Price (USD)</label>
                <input value={price} onChange={e=>setPrice(formatPriceInput(e.target.value))} placeholder="1000" className="w-full p-3 border rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State" className="w-full p-3 border rounded mt-1" />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium">Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-3 border rounded mt-1" rows={3} />
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Image</label>
                <input type="file" accept="image/*" onChange={handleFile} className="block mt-2" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Live preview</div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                    {imageData ? <img src={imageData} alt="preview" className="w-full h-full object-cover" /> : <div className="text-xs text-gray-400">No image</div>}
                  </div>
                  <div>
                    <div className="font-semibold">{wasteType || 'Item name'}</div>
                    <div className="text-sm text-gray-600">Qty: {quantity} · {location || 'Location'} · ${price || '0'}</div>
                    <div className="text-sm text-gray-500 mt-1">{description || 'Short description appears here.'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded">{loading ? 'Adding...' : 'Add Product'}</button>
              <button type="button" className="px-4 py-2 border rounded" onClick={()=>{setWasteType('');setQuantity(1);setPrice('');setLocation('');setDescription('');setImageData(null)}}>Clear</button>
              {successMsg && <div className="text-sm text-green-600">{successMsg}</div>}
            </div>
          </form>
        </div>

        <aside className="w-80">
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">My Listings</h4>
            {myProducts.length === 0 ? <p className="text-sm text-gray-600">No listings yet.</p> : (
              <div className="space-y-2 max-h-[60vh] overflow-auto">
                {myProducts.map(p => (
                  <div key={p.id} className="flex items-start gap-3 p-2 border rounded">
                    <div className="w-16 h-12 bg-gray-50 flex items-center justify-center">
                      {p.imageData ? <img src={p.imageData} className="w-full h-full object-cover" /> : <div className="text-xs text-gray-400">No image</div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.wasteType}</div>
                      <div className="text-xs text-gray-600">Qty: {p.quantity} {p.unit ? '· ' + p.unit : ''} · ${p.price}</div>
                    </div>
                    <div>
                      <button onClick={()=>deleteProduct(p.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
