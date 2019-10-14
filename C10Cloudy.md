## 10.14校内考试

### 总结

这几天考试的题目很水，今天AK的就有十几个。但是我依旧是100分出头。究其原因，主要是没有沉浸到比赛当中去，导致一些简单错误找不出来。

## 1 cloudy

#### 题面描述

[pdf](http://lk.yali.edu.cn/problem/138/101321351625_2.pdf)

#### 题解

一道小学奥术题，适合作为CSPd1t1。为什么想不出？可能我理科本来就比较菜吧。现在，我们考虑先把$3$个小猴子的图画出来，不久，我们就会明白规律：

![figure](https://i.loli.net/2019/10/14/lBztFo4ceTrE5gv.png)

我们容易知道，在最优方案中，每一个小猴子的行走时间肯定是一样的，即猴王在送一个小猴子的时候，临时把它放下来，让它自己走，使得猴王在接另一个小猴子的时候，与这只猴子同时到达终点。因此就会有上图。

接下来，我们尝试用已知的量来表示$T$,就像普通的理科题目一样。想我一样菜的人（可能不会有了）要注意了，应当联系图像传递出来的信息，列出简单合理的等式。

设每一个小猴子行走的时间为$t$，有：
$$
v_1t+(2n-1)v_2t=2(n-1)s
$$

$$
\therefore t=\frac{2(n-1)s}{v_1+(2n-1)v_2}
$$

接着，我们尝试用$t$来表示$T$：
$$
T=t+\frac{s-v_2t}{v_1}
$$

```cpp
#include<bits/stdc++.h>

int main()
{
	freopen("cloudy.in","r",stdin);
	freopen("cloudy.out","w",stdout);
	double s,v1,v2,n;
	std::cin >> s >> n >> v1 >> v2;
	if(v1 < v2) printf("%.5lf",s / v1);
	else {
		auto t0 = 2 * (n - 1) * s / (v1 + (2 * n - 1) * v2);
		printf("%.5lf",t0 + (s - v2 * t0) / v1);
	}

	exit(0);
}

```



### math

#### 题面描述

http://lk.yali.edu.cn/problem/140/101321351625_4.pdf

#### 题解

没什么可说的，题目水。但是我更加水.......要注意的细节不少，而且对拍数据又缺少代表性，导致没有即使差错。只有20分，没什么好说的了。

#### 代码

```cpp
#include<bits/stdc++.h>
#define int long long


const char Wrn[] = "hou tou hou tou shi jie yi liu";

typedef long double ldouble;

int cnt,x,y;
ldouble n,m,t,diff = 1e20;
#define fabs ffabs

const ldouble eps = 1e-18;
inline ldouble ffabs(ldouble x)
{return x > 0 ? x : -x;}
inline void check(ldouble up,ldouble down)
{
	ldouble val = up  / down;
	if(fabs(val - t) < diff) {
		diff = fabs(val - t);
		x = up,y = down;
		cnt = 1;
	} else if(fabs(fabs(val - t) == diff))
		cnt++;
}

signed main()
{
	freopen("math.in","r",stdin);
	freopen("math.out","w",stdout);
	std::ios::sync_with_stdio(false);
	std::cin.tie(0),std::cout.tie(0);

	int c;
	std::cin >> c;
	while(c--) {
		diff = 1e18,cnt = x = y = 0;
		std::cin >> m >> n >> t;
		for(int i = 1;i <= n;i++) {
			int tmp = 1. * i * t;  
			if(tmp <= m && std::__gcd(tmp,i) == 1)
				check(tmp,i);
			if(tmp + 1 <= m && std::__gcd(tmp + 1,i) == 1)
				check(tmp + 1,i);
			if(tmp + 1 > m)
				break;
		}
		if(cnt > 1)
			std::cout << Wrn;
		else
			if(cnt == 0) std::cout << m << "/1";
		else
			std::cout << x << "/" << y;
		std::cout << "\n";
	}

	exit(0);
}
```





