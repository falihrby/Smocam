from supabase import create_client, Client

SUPABASE_URL = "https://lzahhwiqhhpdheoexslk.supabase.co"  
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6YWhod2lxaGhwZGhlb2V4c2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczNDc5NywiZXhwIjoyMDY3MzEwNzk3fQ.gYTCMgud_O9ZUoR_woVJGpATy3yYwHPqndTlD4rvbNk"  
BUCKET_NAME = "smocam-images"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def list_files():
    try:
        files = supabase.storage.from_(BUCKET_NAME).list(path="")   # note: path=""
        if files:
            print(f"✅ Koneksi OK — {len(files)} file ditemukan:")
            for f in files:
                print(f"📄 {f['name']}  |  updated_at: {f['updated_at']}")
        else:
            print("📁 Bucket kosong / kunci anon belum diizinkan untuk SELECT.")
    except Exception as e:
        print("❌ Error saat mengakses Supabase:")
        print(e)

if __name__ == "__main__":
    list_files()