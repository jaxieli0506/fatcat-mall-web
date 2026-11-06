<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const tabs = ['商品種類', '商品小分類', '商品標籤']
const activeTab = ref(tabs[0])

// 狀態
const categories = ref([])
const newCategoryName = ref('')
const editingId = ref(null)
const editingName = ref('')

// 抓取所有商品種類
const fetchCategories = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/ProductCategories')
    categories.value = await res.json()
  } catch (err) {
    console.error('取得商品種類失敗', err)
  }
}

// 新增商品種類
const addCategory = async () => {
  if (!newCategoryName.value.trim()) {
    Swal.fire('請輸入種類名稱', '', 'warning')
    return
  }
  try {
    await fetch('https://localhost:7017/api/ProductCategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.value })
    })
    newCategoryName.value = ''
    await fetchCategories()
    Swal.fire('新增成功', '商品種類已新增', 'success')
  } catch (err) {
    console.error('新增失敗', err)
    Swal.fire('新增失敗', '請稍後再試', 'error')
  }
}

// 刪除種類
const deleteCategory = async (id) => {
  const result = await Swal.fire({
    title: '確定要刪除這個種類？',
    text: '刪除後會一併刪除其小分類，無法復原',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消'
  })
  if (!result.isConfirmed) return

  try {
    await fetch(`https://localhost:7017/api/ProductCategories/${id}`, {
      method: 'DELETE'
    })
    await fetchCategories()
    Swal.fire('刪除成功', '', 'success')
  } catch (err) {
    console.error('刪除失敗', err)
    Swal.fire('刪除失敗', '請稍後再試', 'error')
  }
}

// 進入編輯狀態
const startEdit = (id, name) => {
  editingId.value = id
  editingName.value = name
}

// 儲存修改
const saveEdit = async () => {
  try {
    await fetch(`https://localhost:7017/api/ProductCategories/${editingId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productCategoriesId: editingId.value,
        name: editingName.value
      })
    })
    editingId.value = null
    editingName.value = ''
    await fetchCategories()
    Swal.fire('儲存成功', '商品種類已更新', 'success')
  } catch (err) {
    console.error('更新失敗', err)
    Swal.fire('更新失敗', '請稍後再試', 'error')
  }
}

onMounted(async () => {
  await Promise.all([
    fetchCategories(), // 種類下拉用
    fetchSorts(),      // 小分類用
    fetchTags()        // 標籤用
  ])
})

const sorts = ref([])
const selectedCategoryId = ref('')
const newSortName = ref('')
const editingSortId = ref(null)
const editingSortName = ref('')
const editingSortCategoryId = ref(null)

// 取得所有小分類
const fetchSorts = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/Sorts')
    sorts.value = await res.json()
  } catch (err) {
    console.error('取得小分類失敗', err)
  }
}

// 新增小分類
const addSort = async () => {
  if (!selectedCategoryId.value || !newSortName.value.trim()) {
    return Swal.fire('請選擇種類並輸入小分類名稱', '', 'warning')
  }
  try {
    await fetch('https://localhost:7017/api/Sorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSortName.value,
        categoryId: parseInt(selectedCategoryId.value)
      })
    })
    newSortName.value = ''
    await fetchSorts()
    Swal.fire('新增成功', '小分類已新增', 'success')
  } catch (err) {
    console.error('新增小分類失敗', err)
    Swal.fire('新增失敗', '', 'error')
  }
}

// 編輯小分類
const startSortEdit = (sort) => {
  editingSortId.value = sort.sortId
  editingSortName.value = sort.name
  editingSortCategoryId.value = sort.categoryId
}

const saveSortEdit = async () => {
  try {
    await fetch(`https://localhost:7017/api/Sorts/${editingSortId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sortId: editingSortId.value,
        name: editingSortName.value,
        categoryId: editingSortCategoryId.value
      })
    })
    editingSortId.value = null
    editingSortName.value = ''
    await fetchSorts()
    Swal.fire('儲存成功', '小分類已更新', 'success')
  } catch (err) {
    console.error('更新失敗', err)
    Swal.fire('更新失敗', '', 'error')
  }
}

// 刪除小分類
const deleteSort = async (id) => {
  const result = await Swal.fire({
    title: '確定要刪除這個小分類？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消'
  })
  if (!result.isConfirmed) return

  try {
    await fetch(`https://localhost:7017/api/Sorts/${id}`, {
      method: 'DELETE'
    })
    await fetchSorts()
    Swal.fire('刪除成功', '', 'success')
  } catch (err) {
    console.error('刪除失敗', err)
    Swal.fire('刪除失敗', '', 'error')
  }
}

const tags = ref([])
const newTagName = ref('')
const editingTagId = ref(null)
const editingTagName = ref('')

// 抓取所有標籤
const fetchTags = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/Tags')
    tags.value = await res.json()
  } catch (err) {
    console.error('取得標籤失敗', err)
  }
}

// 新增標籤
const addTag = async () => {
  if (!newTagName.value.trim()) {
    return Swal.fire('請輸入標籤名稱', '', 'warning')
  }
  try {
    await fetch('https://localhost:7017/api/Tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.value })
    })
    newTagName.value = ''
    await fetchTags()
    Swal.fire('新增成功', '', 'success')
  } catch (err) {
    console.error('新增失敗', err)
    Swal.fire('新增失敗', '', 'error')
  }
}

// 編輯標籤
const startTagEdit = (tag) => {
  editingTagId.value = tag.tagsId
  editingTagName.value = tag.name
}

const saveTagEdit = async () => {
  try {
    await fetch(`https://localhost:7017/api/Tags/${editingTagId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagsId: editingTagId.value,
        name: editingTagName.value
      })
    })
    editingTagId.value = null
    editingTagName.value = ''
    await fetchTags()
    Swal.fire('儲存成功', '', 'success')
  } catch (err) {
    console.error('更新失敗', err)
    Swal.fire('更新失敗', '', 'error')
  }
}

// 刪除標籤
const deleteTag = async (id) => {
  const result = await Swal.fire({
    title: '確定要刪除這個標籤？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消'
  })
  if (!result.isConfirmed) return

  try {
    await fetch(`https://localhost:7017/api/Tags/${id}`, {
      method: 'DELETE'
    })
    await fetchTags()
    Swal.fire('刪除成功', '', 'success')
  } catch (err) {
    console.error('刪除失敗', err)
    Swal.fire('刪除失敗', '', 'error')
  }
}
</script>

<template>
  <div class="setting-wrapper">
    <h2>🛠️ 賣場設置</h2>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="{ active: tab === activeTab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- 區塊內容 -->
    <div class="tab-content">
      <!-- 商品種類 -->
      <div v-if="activeTab === '商品種類'">
        <h3>📂 商品種類管理</h3>

        <!-- 新增欄位 -->
        <div class="add-row">
            <input v-model="newCategoryName" placeholder="輸入新種類名稱" />
            <button @click="addCategory">➕ 新增</button>
        </div>

        <!-- 表格 -->
        <table>
            <thead>
            <tr>
                <th>ID</th>
                <th>名稱</th>
                <th>操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="cat in categories" :key="cat.productCategoriesId">
                <td>{{ cat.productCategoriesId }}</td>
                <td>
                <span v-if="editingId !== cat.productCategoriesId">{{ cat.name }}</span>
                <input
                    v-else
                    v-model="editingName"
                    placeholder="輸入新名稱"
                />
                </td>
                <td>
                    <button
                        v-if="editingId !== cat.productCategoriesId"
                        class="edit-btn"
                        @click="startEdit(cat.productCategoriesId, cat.name)"
                    >✏️ 編輯</button>
                    <button
                        v-else
                        class="edit-btn"
                        @click="saveEdit"
                    >💾 儲存</button>
                    <button
                        class="delete-btn"
                        @click="deleteCategory(cat.productCategoriesId)"
                    >🗑 刪除</button>
                    </td>
            </tr>
            </tbody>
        </table>
      </div>

      <!-- 商品小分類 -->
      <div v-if="activeTab === '商品小分類'">
        <h3>🧩 商品小分類管理</h3>

        <!-- 選擇種類 + 新增 -->
        <div class="add-row">
        <select v-model="selectedCategoryId">
            <option disabled value="">請選擇商品種類</option>
            <option
            v-for="cat in categories"
            :key="cat.productCategoriesId"
            :value="cat.productCategoriesId"
            >
            {{ cat.name }}
            </option>
        </select>
        <input v-model="newSortName" placeholder="輸入新小分類名稱" />
        <button @click="addSort">➕ 新增</button>
        </div>

        <!-- 表格 -->
        <table>
        <thead>
            <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>所屬種類</th>
            <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <tr
            v-for="sort in sorts.filter(s => !selectedCategoryId || s.categoryId === parseInt(selectedCategoryId))"
            :key="sort.sortId"
            >
            <td>{{ sort.sortId }}</td>
            <td>
                <span v-if="editingSortId !== sort.sortId">{{ sort.name }}</span>
                <input
                v-else
                v-model="editingSortName"
                placeholder="輸入新名稱"
                />
            </td>
            <td>
                {{
                categories.find(cat => cat.productCategoriesId === sort.categoryId)?.name
                || '未知'
                }}
            </td>
            <td>
                <button
                v-if="editingSortId !== sort.sortId"
                class="edit-btn"
                @click="startSortEdit(sort)"
                >✏️ 編輯</button>

                <button v-else class="edit-btn" @click="saveSortEdit">💾 儲存</button>
                <button class="delete-btn" @click="deleteSort(sort.sortId)">🗑 刪除</button>
            </td>
            </tr>
        </tbody>
        </table>
      </div>

      <!-- 商品標籤 -->
      <div v-if="activeTab === '商品標籤'">
        <h3>🏷️ 商品標籤管理</h3>

        <!-- 新增 -->
        <div class="add-row">
        <input v-model="newTagName" placeholder="輸入標籤名稱" />
        <button @click="addTag">➕ 新增</button>
        </div>

        <!-- 表格 -->
        <table>
        <thead>
            <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="tag in tags" :key="tag.tagsId">
            <td>{{ tag.tagsId }}</td>
            <td>
                <span v-if="editingTagId !== tag.tagsId">{{ tag.name }}</span>
                <input
                v-else
                v-model="editingTagName"
                placeholder="輸入新名稱"
                />
            </td>
            <td>
                <button v-if="editingTagId !== tag.tagsId" class="edit-btn" @click="startTagEdit(tag)">✏️ 編輯</button>
                <button v-else class="edit-btn" @click="saveTagEdit">💾 儲存</button>
                <button class="delete-btn" @click="deleteTag(tag.tagsId)">🗑 刪除</button>
            </td>
            </tr>
        </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.setting-wrapper {
  padding: 2rem;
  background: #f9f6ff;
  border-radius: 16px;
  box-shadow: 0 0 12px rgba(120, 100, 200, 0.1);
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: #e0d4f7;
  color: #4b2ca0;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}

.tabs button.active {
  background: #7c4dff;
  color: white;
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 0 8px rgba(180, 160, 240, 0.1);
}

.add-row {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

.add-row input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  flex: 1;
}

.add-row button {
  padding: 8px 16px;
  background: #7c4dff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background: #eee;
}

button {
  margin-right: 6px;
}
.edit-btn {
  padding: 6px 12px;
  background-color: #ffd966;
  color: #4b2c00;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  font-weight: bold;
}

.edit-btn:hover {
  background-color: #ffcb33;
}

.delete-btn {
  padding: 6px 12px;
  background-color: #ff6f61;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  font-weight: bold;
}

.delete-btn:hover {
  background-color: #e74c3c;
}
</style>