import React, { useRef, useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/ViolationLetter.css";

const formatTanggalLengkap = (timestamp) => {
  if (!timestamp?.toDate) return { hari: "-", tanggal: "-", jam: "-" };
  const date = timestamp.toDate();
  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanList = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const hari = hariList[date.getDay()];
  const tanggal = `${date.getDate()} ${bulanList[date.getMonth()]} ${date.getFullYear()}`;
  const jam = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")} WIB`;
  return { hari, tanggal, jam };
};

const ViolationLetter = () => {
  const { id } = useParams();
  const componentRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "detections", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    };
    fetchData();
  }, [id]);

  const handleExportToPDF = () => {
    const element = componentRef.current;
    const opt = {
      margin: 0,
      filename: "Surat-Pelanggaran-dan-Lampiran.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["css", "legacy"],
      }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!data) return <p>Loading...</p>;
  const { hari, tanggal, jam } = formatTanggalLengkap(data.timestamp);

  return (
    <div className="container">
      <button onClick={handleExportToPDF} className="export-button">
        Download Surat & Lampiran (PDF)
      </button>

      <div ref={componentRef} className="pdf-render-area">
        {/* ======================= HALAMAN PERTAMA ======================= */}
        <div className="page">
          <div className="kop-surat">
            <div className="kop-logo"><img src="/assets/logo-uin.jpg" alt="Logo UIN" /></div>
            <div className="kop-right">
              <div className="kop-title">KEMENTERIAN AGAMA<br />UNIVERSITAS ISLAM NEGERI (UIN)<br />SYARIF HIDAYATULLAH JAKARTA</div>
              <div className="kop-contact">
                <span>Jl. Ir. H. Juanda No. 95 Ciputat 15412 Indonesia Telp. (62-21) 7401925 Fax. (021) 7402982</span>
                <span>Website: www.uinjkt.ac.id  Email: tu.umum@uinjkt.ac.id</span>
              </div>
            </div>
          </div>
          <div className="garis-pembatas"></div>

          <div className="surat-content">
            <div className="info-surat">
              <div className="info-kiri">
                <div className="baris-info"><span className="label">Nomor</span><span className="colon">:</span><span className="value">001/UIN.FST/VI/2025</span></div>
                <div className="baris-info"><span className="label">Lamp</span><span className="colon">:</span><span className="value">Dua Lembar</span></div>
                <div className="baris-info"><span className="label">Hal</span><span className="colon">:</span><span className="value">Surat Konfirmasi Pelanggaran</span></div>
              </div>
              <div className="info-kanan"><p>Jakarta, {tanggal}</p></div>
            </div>

            <div className="penerima"><p><strong>Kepada Yth.</strong></p><p>Sdr/i</p><p>Di Tempat</p></div>

            <div className="isi-surat">
              <ol>
                <li>Rujukan :
                  <ol type="a">
                    <li>Undang-Undang RI No. 36 Tahun 2009 tentang Kesehatan;</li>
                    <li>Peraturan Pemerintah No. 109 Tahun 2012 tentang Pengamanan Bahan yang Mengandung Zat Adiktif Berupa Produk Tembakau bagi Kesehatan;</li>
                    <li>Peraturan Daerah Kota Tangerang Selatan Nomor 4 Tahun 2016 tentang Kawasan Tanpa Rokok (KTR);</li>
                  </ol>
                </li>
                <li>
                  Berdasarkan bukti rekaman CCTV pada hari <strong>{hari}</strong>, tanggal <strong>{tanggal}</strong>, pukul <strong>{jam}</strong>, di area <strong>{data.area} ({data.cctvName})</strong>, saudara diduga telah melakukan pelanggaran berupa aktivitas merokok di Kawasan Tanpa Rokok sebagaimana diatur dalam ketentuan yang berlaku.
                </li>
                <li>
                  Berkaitan dengan butir 1 dan 2, konfirmasi dapat dilakukan dengan menghubungi Unit Pengawasan Lingkungan Kampus atau mendatangi kantor Unit Pengawasan Lingkungan dan Kesehatan pada jam kerja.
                </li>
                <li>
                  Demikian surat konfirmasi ini kami sampaikan untuk menjadi maklum dan ditindaklanjuti sesuai peraturan yang berlaku.
                </li>
              </ol>
            </div>

            <div className="tanda-tangan-container">
              <div className="tanda-tangan">
                <p>a.n. Dekan Fakultas Sains dan Teknologi</p>
                <div className="spasi-ttd"></div>
                <p className="nama-pejabat">Husni Teja Sukmana S.T., M.Sc, Ph.D</p>
                <p>NIP. 197710302001121003</p>
              </div>
            </div>

            <div className="tembusan">
              <p><strong>Tembusan:</strong></p>
              <ol>
                <li>Rektor (sebagai laporan)</li>
                <li>Arsip</li>
              </ol>
            </div>
          </div>
        </div>

        {/* ======================= HALAMAN KEDUA ======================= */}
        <div className="page">
          <div className="kop-surat">
            <div className="kop-logo"><img src="/assets/logo-uin.jpg" alt="Logo UIN" /></div>
            <div className="kop-right">
              <div className="kop-title">KEMENTERIAN AGAMA<br />UNIVERSITAS ISLAM NEGERI (UIN)<br />SYARIF HIDAYATULLAH JAKARTA</div>
              <div className="kop-contact">
                <span>Jl. Ir. H. Juanda No. 95 Ciputat 15412 Indonesia Telp. (62-21) 7401925 Fax. (021) 7402982</span>
                <span>Website: www.uinjkt.ac.id  Email: tu.umum@uinjkt.ac.id</span>
              </div>
            </div>
          </div>
          <div className="garis-pembatas"></div>

          <h3 className="lampiran-title">LAMPIRAN SURAT KONFIRMASI</h3>

          <div className="lampiran-section">
            <p><strong>I. IDENTITAS PELANGGAR</strong></p>
            <div className="identitas-list">
              {["NAMA", "NIM", "JURUSAN", "FAKULTAS", "ALAMAT", "NO. HANDPHONE"].map((label, i) => (
                <div key={i} className="identitas-row">
                  <span className="identitas-label">{`${i + 1}. ${label}`}</span>
                  <span className="identitas-colon">:</span>
                  <span className="identitas-value"></span>
                </div>
              ))}
            </div>
          </div>

          <div className="lampiran-section">
            <p><strong>II. KETENTUAN</strong></p>
            <ol className="ketentuan-list" type="a">
              <li>Jika surat tidak diisi, maka pelanggar dapat dikenakan sanksi sesuai peraturan berlaku.</li>
              <li>Sanksi diberikan jika tidak ada konfirmasi selama 7 hari sejak rekaman pelanggaran.</li>
              <li>Konfirmasi dilakukan di Kantor Unit Pengawasan Lingkungan dan Kesehatan UIN Jakarta pada jam kerja.</li>
            </ol>
          </div>

          <div className="lampiran-section">
            <p><strong>III. FOTO PELANGGARAN</strong></p>
            <div className="foto-container">
              <div className="foto-item">
                <img src={data.imageUrl || "https://via.placeholder.com/250x150.png?text=Bukti+Foto"} alt="Bukti Pelanggaran" />
              </div>
            </div>
          </div>

          <div className="lampiran-signature">
            <p>Jakarta, {tanggal}</p>
            <p>Yang Menyatakan,</p>
            <div className="signature-space"></div>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationLetter;
