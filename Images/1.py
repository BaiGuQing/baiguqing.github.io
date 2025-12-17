import os
import sys

def batch_rename_images(target_dir):
    # 设定要移除的前缀 (注意最后的空格)
    prefix = "Pasted image "
    
    # 计数器
    count = 0
    pending_renames = []

    print(f"正在扫描目录: {target_dir} ...\n")

    # 1. 扫描阶段：os.walk 会遍历所有子目录
    for root, dirs, files in os.walk(target_dir):
        for filename in files:
            # 检查文件是否以指定前缀开头
            if filename.startswith(prefix):
                # 构建旧路径和新路径
                old_path = os.path.join(root, filename)
                
                # 去掉前缀
                new_filename = filename.replace(prefix, "")
                new_path = os.path.join(root, new_filename)
                
                # 防止重名覆盖（万一目录下已经有了同名文件）
                if os.path.exists(new_path):
                    print(f"[跳过] 目标文件已存在: {new_filename}")
                    continue

                pending_renames.append((old_path, new_path, filename, new_filename))
                count += 1

    if count == 0:
        print("未找到需要重命名的文件。")
        return

    # 2. 预览阶段
    print(f"发现 {count} 个文件需要重命名：")
    print("-" * 50)
    for old, new, old_name, new_name in pending_renames:
        print(f"原名: {old_name}")
        print(f"新名: {new_name}")
        print("-" * 20)
    print("-" * 50)

    # 3. 确认阶段
    user_input = input(f"确认要执行这 {count} 个文件的重命名吗？(y/n): ").lower()

    if user_input == 'y':
        # 4. 执行阶段
        success_count = 0
        for old_path, new_path, _, _ in pending_renames:
            try:
                os.rename(old_path, new_path)
                print(f"[成功] {os.path.basename(old_path)} -> {os.path.basename(new_path)}")
                success_count += 1
            except Exception as e:
                print(f"[失败] {os.path.basename(old_path)}: {e}")
        
        print(f"\n全部完成！成功修改了 {success_count} 个文件。")
    else:
        print("\n操作已取消，未修改任何文件。")

if __name__ == "__main__":
    # 这里填你 source 文件夹的绝对路径
    # 例如 Windows: r"D:\Blog\source"
    # 或者留空，运行时手动输入
    input_dir = input("请输入包含图片的文件夹路径 (直接回车退出): ").strip()
    
    # 去除可能的引号（Windows复制路径时常带引号）
    input_dir = input_dir.strip('"').strip("'")

    if input_dir and os.path.isdir(input_dir):
        batch_rename_images(input_dir)
    else:
        print("路径无效或为空。")