const express = require('express');
// const fetch = require('node-fetch');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
// const PORT = 3000;

app.use(express.static('public'));

app.get('/api/data', async (req, res) => {
    const searchKey = req.query.search;
    const wh = req.query.wh;

      // ✅ Log ra 2 biến
    console.log('🔍 searchKey:', searchKey);
    console.log('🏢 WH:', wh);
  
    if (!searchKey) {
      return res.status(400).json({ error: "Vui lòng nhập Mã đơn hàng" });
    }

  const myHeaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://wms.ssc.shopee.vn",
    "priority": "u=1, i",
    "referer": "https://wms.ssc.shopee.vn/v2/salesoutbound/task/subPicking",
    "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "x-cctv-tenant-id": "WMS",
    "x-csrftoken": "KC5Wl4vyWq6wsuE1KEj3W66FvMX8Osxm",
    "Cookie": wh
  };

  const raw = JSON.stringify({
    search_key_one: searchKey,
    // is_add_picking: 1,
    fulfillment_chain_dest_zone_list: [],
    pageno: 1,
    count: 20
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw
  };

  try {
    const response = await fetch("https://wms.ssc.shopee.vn/api/v2/apps/process/taskcenter/pickingtask/search_sales_sub_picking_task", requestOptions);
    const data = await response.json();

    const subPickupId = data?.data?.list?.[0]?.sub_pickup_id;

    if (!subPickupId) return res.status(404).json({ error: "Không tìm thấy sub_pickup_id" });

    const detailUrl = `https://wms.ssc.shopee.vn/api/v2/apps/process/taskcenter/pickingtask/get_sales_sub_picking_sku_list?count=200&pageno=1&sub_pickup_id=${subPickupId}`;
    const requestDetailOptions = {
      method: 'GET',
      headers: myHeaders
    };

    const resDetail = await fetch(detailUrl, requestDetailOptions);
    const detailData = await resDetail.json();
    const skuList = detailData?.data?.sub_picking_sku_list?.map(item => ({
      sku_id: item.sku_id,
      sku_name: item.sku_name,
      suggest_locations: item.suggest_locations?.join(', ') || '',
      total_quantity: item.total_quantity
    })) || [];

    res.json({ sub_pickup_id: subPickupId, skus: skuList });

  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu từ Shopee' });
  }
});


const PORT = 3000

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
